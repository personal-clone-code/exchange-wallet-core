import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { CurrencyRegistry, getLogger } from 'sota-common';
import { User, CurrencyConfig, Wallet } from '../entities';

const logger = getLogger('DBTools::# UserWallet::');

export async function doCheckUserWallet(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckUserWallet(manager);
  });
}

async function _doCheckUserWallet(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const userWalletErrors: string[] = [];
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
    const uniquePlatform = new Set();
    const subTasks = _.map(currencyConfigs, async config => {
      const currency = CurrencyRegistry.getOneCurrency(config.currency);
      const platfrom = currency.family || currency.platform;
      if(uniquePlatform.has(platfrom)){
        return;
      }
      uniquePlatform.add(platfrom);
      const wallet = await manager.getRepository(Wallet).findOne({
        userId: user.id,
        currency: platfrom,
      });
      if (!wallet) {
        userWalletErrors.push(`There\'s no wallet for user ${user.id} (${config.currency})`);
      }
    });
    await Promise.all(subTasks);
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: userWalletErrors.length === 0,
      totalErrors: userWalletErrors.length,
      details: userWalletErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
