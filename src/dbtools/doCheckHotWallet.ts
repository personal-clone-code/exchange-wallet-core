import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, HotWalletType } from 'sota-common';
import { Wallet, HotWallet } from '../entities';

const logger = getLogger('DBTools::# HotWallet::');

export async function doCheckHotWallet(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckHotWallet(manager);
  });
}

async function _doCheckHotWallet(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const hotWalletErrors: string[] = [];
  const wallets = await manager.getRepository(Wallet).find();
  if (!wallets || wallets.length === 0) {
    logger.warn(`There\'re no wallets. So, skipping.`);
  }
  const tasks = _.map(wallets, async wallet => {
    const subTasks = _.map(HotWalletType, async type => {
      const hotWallet = await manager.getRepository(HotWallet).findOne({
        walletId: wallet.id,
        currency: wallet.currency,
        type: type as string,
      });
      if (!hotWallet) {
        hotWalletErrors.push(
          `There\'s no hot (${type.toUpperCase()}) wallet for wallet ${wallet.id} (${wallet.currency})`
        );
      }
    });
    await Promise.all(subTasks);
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: hotWalletErrors.length === 0,
      totalErrors: hotWalletErrors.length,
      details: hotWalletErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
