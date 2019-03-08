import { Config, CurrencyToken } from '../../entities';
import {
  buildListTokenSymbols,
  Currency,
  getLogger,
  setBlockchainNetworkEnv,
  setCurrencyConfig,
  setTokenData,
  updateValidApiEndpoint,
} from 'sota-common';
import { createConnection, getConnection } from 'typeorm';

const logger = getLogger('prepareWorker');

export async function prepareCurrencyWorker(currency: Currency, tokenType?: string): Promise<void> {
  await prepareCommonWorker();
  const connection = getConnection();

  // same network
  const [allTokens, configByCurrency, configByTokenType] = await Promise.all([
    connection.getRepository(CurrencyToken).find({}),
    connection.getRepository(Config).findOne({ currency }),
    tokenType ? connection.getRepository(Config).findOne({ currency: tokenType }) : null,
  ]);

  if (allTokens.length === 0) {
    logger.warn('Cannot get any currency configurations in currency table');
  }
  if (!configByCurrency && !configByTokenType) {
    throw new Error(`Cannot find ${currency.toString().toUpperCase()} configuration in config table`);
  }
  await setTokenData(allTokens.map(token => Object.assign(token)));

  buildListTokenSymbols(currency, tokenType);
  setCurrencyConfig(currency, configByTokenType ? configByTokenType : configByCurrency);
  setBlockchainNetworkEnv();
  await updateValidApiEndpoint();

  return;
}

export async function prepareCommonWorker(): Promise<void> {
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
}
