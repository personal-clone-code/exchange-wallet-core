import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, CurrencyRegistry, BlockchainPlatform } from 'sota-common';
import { User, CurrencyConfig, Currency } from '../entities';

const limit = 50;
const logger = getLogger('DBTools::# CurrencyConfig::');

export async function doCheckCurrencyConfig(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckCurrencyConfig(manager);
  });
}

async function _doCheckCurrencyConfig(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const currencyConfigErrors: string[] = [];
  const totalUsers = await manager.getRepository(User).count();
  const totalRounds = Math.ceil(totalUsers / limit);
  const round = Array.from(Array(totalRounds).keys());
  for (const r of round) {
    const users = await manager.getRepository(User).find({
      take: limit,
      skip: r * limit,
    });
    if (!users || users.length === 0) {
      logger.warn(`There\'re no users. So, skip round ${r}.`);
      return;
    }
    const currencyConfigs = await manager.getRepository(CurrencyConfig).find();
    if (!currencyConfigs || currencyConfigs.length === 0) {
      logger.warn(`There\'re no currency configs. So, skip round ${r}.`);
      return;
    }
    const tasks = _.map(users, async user => {
      const subTasks = _.map(currencyConfigs, async config => {
        const currenciesOfPlatform = CurrencyRegistry.getCurrenciesOfPlatform(config.currency as BlockchainPlatform);
        const currencyTasks = _.map(currenciesOfPlatform, async currency => {
          const result = await manager.getRepository(Currency).findOne({
            userId: user.id,
            symbol: currency.symbol,
          });
          if (!result) {
            currencyConfigErrors.push(`There\'s no currency setting for user ${user.id} (${currency.symbol})`);
          }
        });
        await Promise.all(currencyTasks);
      });
      await Promise.all(subTasks);
    });
    await Promise.all(tasks);
  }
  logger.info(
    `${JSON.stringify({
      isOK: currencyConfigErrors.length === 0,
      totalErrors: currencyConfigErrors.length,
      details: currencyConfigErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
