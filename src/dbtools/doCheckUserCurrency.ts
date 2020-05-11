import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, CurrencyRegistry, BlockchainPlatform } from 'sota-common';
import { User, CurrencyConfig, UserCurrency } from '../entities';

const logger = getLogger('DBTools::# UserCurrency::');

export async function doCheckUserCurrency(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckUserCurrency(manager);
  });
}

async function _doCheckUserCurrency(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const userCurrencyErrors: string[] = [];
  const users = await manager.getRepository(User).find();
  if (!users || users.length === 0) {
    logger.warn(`There\'re no users. So, skipping.`);
    return;
  }
  const currencyConfigs = await manager.getRepository(CurrencyConfig).find();
  if (!currencyConfigs || currencyConfigs.length === 0) {
    logger.warn(`There\'re no currency configs. So, skipping.`);
    return;
  }
  const tasks = _.map(users, async user => {
    const subTasks = _.map(currencyConfigs, async config => {
      const currenciesOfPlatform = CurrencyRegistry.getCurrenciesOfPlatform(config.currency as BlockchainPlatform);
      let tokensOfPlatform = _.map(currenciesOfPlatform, currency => (!currency.isNative ? currency : null));
      tokensOfPlatform = _.compact(tokensOfPlatform);
      const tokenTasks = _.map(tokensOfPlatform, async token => {
        const result = await manager.getRepository(UserCurrency).findOne({
          userId: user.id,
          systemSymbol: token.symbol,
        });
        if (!result) {
          userCurrencyErrors.push(`There\'s no user currency for user ${user.id} (${token.symbol})`);
        }
      });
      await Promise.all(tokenTasks);
    });
    await Promise.all(subTasks);
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: userCurrencyErrors.length === 0,
      totalErrors: userCurrencyErrors.length,
      details: userCurrencyErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
