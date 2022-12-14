import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, HotWalletType } from 'sota-common';
import { Wallet, HotWallet } from '../entities';

const logger = getLogger('DBTools::# RallyWallet::');

export async function doCheckRallyWallet(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckRallyWallet(manager);
  });
}

async function _doCheckRallyWallet(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const rallyWalletErrors: string[] = [];
  const wallets = await manager.getRepository(Wallet).find();
  if (!wallets || wallets.length === 0) {
    logger.warn(`There\'re no wallets. So, skipping.`);
  }
  const tasks = _.map(wallets, async wallet => {
    const subTasks = _.map(HotWalletType, async type => {
      const rallyWallet = await manager.getRepository(HotWallet).findOne({
        walletId: wallet.id,
        currency: wallet.currency,
        type: type as string,
      });
      if (!rallyWallet) {
        rallyWalletErrors.push(
          `There\'s no rally (${type.toUpperCase()}) wallet for wallet ${wallet.id} (${wallet.currency})`
        );
      }
    });
    await Promise.all(subTasks);
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: rallyWalletErrors.length === 0,
      totalErrors: rallyWalletErrors.length,
      details: rallyWalletErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
