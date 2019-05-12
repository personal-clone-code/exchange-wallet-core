import { createConnection, getConnection } from 'typeorm';
import { getLogger, BlockchainPlatform, CurrencyRegistry, EnvConfigRegistry } from 'sota-common';
import { CurrencyConfig, EnvConfig } from './entities';
import _ from 'lodash';

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

  const [currencyConfigs, envConfigs] = await Promise.all([
    connection.getRepository(CurrencyConfig).find({}),
    connection.getRepository(EnvConfig).find({}),
  ]);

  currencyConfigs.forEach(config => {
    const platforms = _.values(BlockchainPlatform);
    if (!_.includes(platforms, config.currency)) {
      return;
    }

    const currency = CurrencyRegistry.getOneNativeCurrency(config.currency as BlockchainPlatform);
    CurrencyRegistry.setCurrencyConfig(currency, config);
  });

  envConfigs.forEach(config => {
    EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
  });

  // TODO: set config properly
  CurrencyRegistry.registerErc20Token('0x61C563db2f69e4c8435764b3cB434604605Ecb8B', 'xcr', 'XCR Token', 18);

  logger.info(`Environment has been setup successfully...`);
  return;
}
