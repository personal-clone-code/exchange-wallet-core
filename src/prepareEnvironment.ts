import { createConnection, getConnection } from 'typeorm';
import { getLogger, CurrencyRegistry, EnvConfigRegistry, ICurrency, Utils, settleEnvironment } from 'sota-common';
import { CurrencyConfig, EnvConfig, Erc20Token, EosToken, Trc20Token } from './entities';
import _ from 'lodash';
import { prepareWalletBalanceAll } from './callbacks';
import { OmniToken } from './entities/OmniToken';

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

  const [currencyConfigs, envConfigs, erc20Tokens, trc20Tokens, eosTokens, omniTokens] = await Promise.all([
    connection.getRepository(CurrencyConfig).find({}),
    connection.getRepository(EnvConfig).find({}),
    connection.getRepository(Erc20Token).find({}),
    connection.getRepository(Trc20Token).find({}),
    connection.getRepository(EosToken).find({}),
    connection.getRepository(OmniToken).find({}),
  ]);

  envConfigs.forEach(config => {
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

  currencyConfigs.forEach(config => {
    if (!CurrencyRegistry.hasOneCurrency(config.currency)) {
      throw new Error(`There's config for unknown currency: ${config.currency}`);
    }

    const currency = CurrencyRegistry.getOneCurrency(config.currency);
    CurrencyRegistry.setCurrencyConfig(currency, config);
  });

  await settleEnvironment();

  // seperate command by platform
  await Utils.PromiseAll([
    prepareWalletBalanceAll(erc20Currencies),
    prepareWalletBalanceAll(trc20Currencies),
    prepareWalletBalanceAll(omniCurrencies),
    prepareWalletBalanceAll(eosCurrencies)
  ]);

  logger.info(`Environment has been setup successfully...`);
  return;
}
