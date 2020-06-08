import { createConnection, getConnection } from 'typeorm';
import {
  getLogger,
  CurrencyRegistry,
  EnvConfigRegistry,
  ICurrency,
  Utils,
  settleEnvironment,
  getRedisSubscriber,
  registerMailEventCallback,
} from 'sota-common';
import { CurrencyConfig, EnvConfig, Erc20Token, EosToken, Trc20Token, NemEnvConfig, TerraToken } from './entities';
import _ from 'lodash';
import { prepareWalletBalanceAll } from './callbacks';
import { OmniToken } from './entities/OmniToken';
import { IMailJobProps, insertMailJob } from './rawdb';

const logger = getLogger('prepareEnvironment');

export async function prepareEnvironment(): Promise<void> {
  logger.info(`Application has been started.`);
  logger.info(`Preparing DB connection...`);
  await createConnection({
    name: 'default',
    type: 'mysql',
    host: process.env.TYPEORM_HOST,
    port: process.env.TYPEORM_PORT ? parseInt(process.env.TYPEORM_PORT, 10) : 3306,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    database: process.env.TYPEORM_DATABASE,
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING ? process.env.TYPEORM_LOGGING === 'true' : true,
    cache: process.env.TYPEORM_CACHE ? process.env.TYPEORM_CACHE === 'true' : true,
    entities: process.env.TYPEORM_ENTITIES.split(','),
  });

  logger.info(`DB connected successfully...`);
  const connection = getConnection();
  logger.info(`Loading environment configurations from database...`);

  const [currencyConfigs, envConfigs, erc20Tokens, trc20Tokens, eosTokens, omniTokens, terraTokens] = await Promise.all(
    [
      connection.getRepository(CurrencyConfig).find({}),
      connection.getRepository(EnvConfig).find({}),
      connection.getRepository(Erc20Token).find({}),
      connection.getRepository(Trc20Token).find({}),
      connection.getRepository(EosToken).find({}),
      connection.getRepository(OmniToken).find({}),
      connection.getRepository(TerraToken).find({}),
    ]
  );

  envConfigs.forEach(config => {
    EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
  });

  // register NEM env config
  const nemEnvConfigs = await connection.getRepository(NemEnvConfig).find({});
  nemEnvConfigs.forEach(config => {
    EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
  });

  const erc20Currencies: ICurrency[] = [];
  erc20Tokens.forEach(token => {
    CurrencyRegistry.registerErc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
    erc20Currencies.push(CurrencyRegistry.getOneCurrency(`erc20.${token.contractAddress}`));
  });

  const trc20Currencies: ICurrency[] = [];
  trc20Tokens.forEach(token => {
    CurrencyRegistry.registerTrc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
    trc20Currencies.push(CurrencyRegistry.getOneCurrency(`trc20.${token.contractAddress}`));
  });

  const omniCurrencies: ICurrency[] = [];
  omniTokens.forEach(token => {
    CurrencyRegistry.registerOmniAsset(token.propertyId, token.symbol, token.name, token.scale);
    omniCurrencies.push(CurrencyRegistry.getOneCurrency(`omni.${token.propertyId}`));
  });

  const eosCurrencies: ICurrency[] = [];
  eosTokens.forEach(token => {
    CurrencyRegistry.registerEosToken(token.code, token.symbol, token.scale);
    eosCurrencies.push(CurrencyRegistry.getOneCurrency(`eos.${token.symbol}`));
  });

  const terraCurrencies: ICurrency[] = [];
  terraTokens.forEach(token => {
    CurrencyRegistry.registerTerraToken(token.code, token.symbol, token.scale);
    terraCurrencies.push(CurrencyRegistry.getOneCurrency(`terra.${token.symbol}`));
  });

  currencyConfigs.forEach(config => {
    if (!CurrencyRegistry.hasOneCurrency(config.currency)) {
      throw new Error(`There's config for unknown currency: ${config.currency}`);
    }

    const currency = CurrencyRegistry.getOneCurrency(config.currency);
    CurrencyRegistry.setCurrencyConfig(currency, config);
  });

  // 30/12/2019 check redis is enable or not
  if (EnvConfigRegistry.isUsingRedis()) {
    const redisHost = EnvConfigRegistry.getCustomEnvConfig('REDIS_HOST');
    const redisPort = EnvConfigRegistry.getCustomEnvConfig('REDIS_PORT');
    const redisUrl = EnvConfigRegistry.getCustomEnvConfig('REDIS_URL');
    if ((!redisHost && !redisUrl) || (!redisPort && !redisUrl)) {
      throw new Error(
        `Some redis configs are missing. REDIS_HOST=${redisHost}, REDIS_PORT=${redisPort}, REDIS_URL=${redisUrl}`
      );
    }
  }

  const redisSubscriber = getRedisSubscriber();
  redisSubscriber.on('message', onRedisMessage);

  registerMailEventCallback(async messages => {
    const appName: string = process.env.APP_NAME || 'Exchange Wallet';
    const receiver = EnvConfigRegistry.getCustomEnvConfig('MAIL_RECIPIENT_ERROR_ALERT');
    if (!receiver) {
      logger.warn(`Could not send to receiver=${receiver}. Please check the recepient address.`);
      return;
    }
    const sender = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_ADDRESS');
    const senderName = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_NAME');
    await connection.transaction(async manager => {
      const props: IMailJobProps = {
        senderAddress: sender,
        senderName,
        recipientAddress: receiver,
        title: `[${appName}] Error Notifier`,
        templateName: 'logger_error_notifier_layout.hbs',
        content: {
          error_message: messages.join('<br />'),
        },
      };
      await insertMailJob(manager, props);
    });
  });

  await settleEnvironment();

  // seperate command by platform
  await Utils.PromiseAll([
    prepareWalletBalanceAll([...eosCurrencies, CurrencyRegistry.EOS]),
    prepareWalletBalanceAll([...trc20Currencies, CurrencyRegistry.Tomo]),
    prepareWalletBalanceAll([...erc20Currencies, CurrencyRegistry.Ethereum]),
    prepareWalletBalanceAll([...omniCurrencies, CurrencyRegistry.Bitcoin]),
    prepareWalletBalanceAll([...terraCurrencies, CurrencyRegistry.Terra]),
  ]);

  logger.info(`Environment has been setup successfully...`);
  return;
}

function onRedisMessage(channel: any, message: any) {
  const appId = EnvConfigRegistry.getAppId();
  if (appId !== channel) {
    return;
  }

  // To reload data, just exit and let supervisor starts process again
  // This is deprecated now. Will be removed shortly, when all the publishers are updated
  if (message === 'EVENT_NEW_ERC20_TOKEN_ADDED' || message === 'EVENT_NEW_ERC20_TOKEN_REMOVED') {
    logger.warn(`RedisChannel::subscribeRedisChannel on message=${message}. Will exit to respawn...`);
    process.exit(0);
  }

  let messageObj: any = null;
  try {
    messageObj = JSON.parse(message);
  } catch (e) {
    logger.warn(`Unexpected message from redis: ${message}`);
  }

  if (!messageObj) {
    return;
  }

  if (messageObj) {
    const contractAddress = messageObj.data.toString();
    switch (messageObj.event) {
      case 'EVENT_NEW_ERC20_TOKEN_ADDED':
        findAndRegisterNewErc20Token(contractAddress).catch(e => {
          logger.error(`Could not find and load new added ERC20 token [${contractAddress}] due to error:`);
          logger.error(e);
        });
        break;

      case 'EVENT_NEW_ERC20_TOKEN_REMOVED':
        findAndUnregisterErc20Token(contractAddress).catch(e => {
          logger.error(`Could not find and delete added ERC20 token [${contractAddress}] due to error:`);
          logger.error(e);
        });
        break;

      default:
        break;
    }
  }
}

async function findAndRegisterNewErc20Token(contractAddress: string) {
  const connection = getConnection();
  const token = await connection.getRepository(Erc20Token).findOne({ contractAddress });
  if (!token) {
    throw new Error(`Could not find ERC20 token in database: ${contractAddress}`);
  }

  CurrencyRegistry.registerErc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
  logger.info(`Register new added ERC20 token: contract=${token.contractAddress} symbol=${token.symbol}`);
}

async function findAndUnregisterErc20Token(contractAddress: string) {
  CurrencyRegistry.unregisterErc20Token(contractAddress);
  logger.info(`Unregister new added ERC20 token: contract=${contractAddress}`);
}
