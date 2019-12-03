import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger } from 'sota-common';
import { User, CurrencyConfig, Wallet } from '../entities';

const limit = 50;
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
        const wallet = await manager.getRepository(Wallet).findOne({
          userId: user.id,
          currency: config.currency,
        });
        if (!wallet) {
          userWalletErrors.push(`There\'s no wallet for user ${user.id} (${config.currency})`);
        }
      });
      await Promise.all(subTasks);
    });
    await Promise.all(tasks);
  }
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
