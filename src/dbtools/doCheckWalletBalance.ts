import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, CurrencyRegistry, BigNumber, BlockchainPlatform } from 'sota-common';
import { Wallet, WalletBalance, WalletLog } from '../entities';
import { WalletEvent } from '../Enums';

const limit = 500;
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
  const wallets = await manager.getRepository(Wallet).find();
  if (!wallets || wallets.length === 0) {
    logger.warn(`There\'re no wallets. So, skipping.`);
    return;
  }
  const tasks = _.map(wallets, async wallet => {
    const currenciesOfPlatform = CurrencyRegistry.getCurrenciesOfPlatform(wallet.currency as BlockchainPlatform);
    if (wallet.currency === BlockchainPlatform.Ethereum){
      currenciesOfPlatform.push(...CurrencyRegistry.getCurrenciesOfPlatform(BlockchainPlatform.BinanceSmartChain));
    }
    const balanceTasks = _.map(currenciesOfPlatform, async currency => {
      const walletBalance = await manager.getRepository(WalletBalance).findOne({
        walletId: wallet.id,
        currency: currency.symbol,
      });
      if (walletBalance) {
        const totalWalletLogs = await manager.getRepository(WalletLog).count({
          walletId: wallet.id,
          currency: currency.symbol,
        });
        let totalBalanceLogs = new BigNumber(0);
        const totlaRound = Math.ceil(totalWalletLogs / limit);
        const round = Array.from(Array(totlaRound).keys());
        for (const r of round) {
          let walletLogs = await manager.getRepository(WalletLog).find({
            where: {
              walletId: wallet.id,
              currency: currency.symbol,
            },
            take: limit,
            skip: r * limit,
          });
          if (walletLogs && walletLogs.length !== 0) {
            walletLogs = _.map(walletLogs, w => (w.event !== WalletEvent.WITHDRAW_REQUEST ? w : null));
            walletLogs = _.compact(walletLogs);
            _.map(walletLogs, log => {
              totalBalanceLogs = totalBalanceLogs.plus(log.balanceChange);
            });
          }
        }
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
