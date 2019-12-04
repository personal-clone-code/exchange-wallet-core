import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, HotWalletType } from 'sota-common';
import { Wallet, HotWallet } from '../entities';

const logger = getLogger('DBTools::# ColdWallet::');

export async function doCheckColdWallet(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckColdWallet(manager);
  });
}

async function _doCheckColdWallet(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const coldWalletErrors: string[] = [];
  const wallets = await manager.getRepository(Wallet).find();
  if (!wallets || wallets.length === 0) {
    logger.warn(`There\'re no wallets. So, skipping.`);
    return;
  }
  const tasks = _.map(wallets, async wallet => {
    const subTasks = _.map(HotWalletType, async type => {
      const coldWallet = await manager.getRepository(HotWallet).findOne({
        walletId: wallet.id,
        currency: wallet.currency,
        type: type as string,
      });
      if (!coldWallet) {
        coldWalletErrors.push(
          `There\'s no cold (${type.toUpperCase()}) walle for wallet ${wallet.id} (${wallet.currency})`
        );
      }
    });
    await Promise.all(subTasks);
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: coldWalletErrors.length === 0,
      totalErrors: coldWalletErrors.length,
      details: coldWalletErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
