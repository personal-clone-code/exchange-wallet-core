import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, CurrencyRegistry, BigNumber, BlockchainPlatform } from 'sota-common';
import { Wallet, WalletBalance, WalletLog } from '../entities';
import { WalletEvent } from '../Enums';

const limit = 50;
const logger = getLogger('DBTools::# WalletBalance::');

export async function doCheckWalletBalance(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckWalletBalance(manager);
  });
}

async function _doCheckWalletBalance(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const walletBalanceErrors: string[] = [];
  const totalWallets = await manager.getRepository(Wallet).count();
  const totalRounds = Math.ceil(totalWallets / limit);
  const round = Array.from(Array(totalRounds).keys());
  for (const r of round) {
    const wallets = await manager.getRepository(Wallet).find({
      take: limit,
      skip: r * limit,
    });
    if (!wallets || wallets.length === 0) {
      logger.warn(`There\'re no wallets. So, skip round ${r}.`);
      return;
    }
    const tasks = _.map(wallets, async wallet => {
      const currenciesOfPlatform = CurrencyRegistry.getCurrenciesOfPlatform(wallet.currency as BlockchainPlatform);
      const balanceTasks = _.map(currenciesOfPlatform, async currency => {
        const walletBalance = await manager.getRepository(WalletBalance).findOne({
          walletId: wallet.id,
          currency: currency.symbol,
        });
        if (walletBalance) {
          let walletLogs = await manager.getRepository(WalletLog).find({
            walletId: wallet.id,
            currency: currency.symbol,
          });
          walletLogs = _.map(walletLogs, w => (w.event !== WalletEvent.WITHDRAW_REQUEST ? w : null));
          walletLogs = _.compact(walletLogs);
          let totalBalanceLogs = new BigNumber(0);
          _.map(walletLogs, log => {
            totalBalanceLogs = totalBalanceLogs.plus(log.balanceChange);
          });
          if (!new BigNumber(walletBalance.balance).eq(totalBalanceLogs)) {
            walletBalanceErrors.push(
              `Wallet ${wallet.id} (${currency.symbol}) has wrong balance. Got ${
                walletBalance.balance
              }, expected ${totalBalanceLogs}`
            );
          }
        } else {
          walletBalanceErrors.push(`Wallet ${wallet.id} (${currency.symbol}) does not have wallet balance`);
        }
      });
      await Promise.all(balanceTasks);
    });
    await Promise.all(tasks);
  }
  logger.info(
    `${JSON.stringify({
      isOK: walletBalanceErrors.length === 0,
      totalErrors: walletBalanceErrors.length,
      details: walletBalanceErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
