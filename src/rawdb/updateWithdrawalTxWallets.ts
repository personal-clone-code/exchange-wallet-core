import { BigNumber, CurrencyRegistry } from 'sota-common';
import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent } from '../Enums';
import { WalletBalance, WalletLog, Withdrawal, LocalTx } from '../entities';

import * as rawdb from './index';
import { Utils } from 'sota-common';

export async function updateWithdrawalTxWallets(
  manager: EntityManager,
  localTx: LocalTx,
  event: WithdrawalEvent.COMPLETED | WithdrawalEvent.FAILED,
  fee: BigNumber
): Promise<WalletBalance> {
  const withdrawals = await manager.find(Withdrawal, {
    withdrawalTxId: localTx.id,
  });

  let walletEvent: WalletEvent;
  const feeCurrency = CurrencyRegistry.getOneCurrency(localTx.currency).platform;

  if (!withdrawals.length) {
    return null;
  }

  const withdrawalFeeLog = new WalletLog();
  withdrawalFeeLog.walletId = withdrawals[0].walletId;
  withdrawalFeeLog.currency = feeCurrency;
  withdrawalFeeLog.refCurrency = localTx.currency;
  withdrawalFeeLog.balanceChange = `-${fee}`;
  withdrawalFeeLog.event = WalletEvent.WITHDRAW_FEE;
  withdrawalFeeLog.refId = localTx.id;

  await Utils.PromiseAll([
    Utils.PromiseAll(
      withdrawals.map(async record => {
        let balanceChange: string;
        const walletBalance = await manager.findOne(WalletBalance, {
          walletId: record.walletId,
        });

        if (!walletBalance) {
          throw new Error('walletBalance is not existed');
        }

        if (event === WithdrawalEvent.FAILED) {
          walletEvent = WalletEvent.WITHDRAW_FAILED;
          balanceChange = '0';
        }

        if (event === WithdrawalEvent.COMPLETED) {
          walletEvent = WalletEvent.WITHDRAW_COMPLETED;
          balanceChange = '-' + record.amount;
        }

        const walletLog = new WalletLog();
        walletLog.walletId = walletBalance.walletId;
        walletLog.currency = localTx.currency;
        walletLog.refCurrency = localTx.currency;
        walletLog.balanceChange = balanceChange;
        walletLog.event = walletEvent;
        walletLog.refId = record.id;

        const currency = CurrencyRegistry.getOneCurrency(record.currency);
        await Utils.PromiseAll([
          manager
            .createQueryBuilder()
            .update(WalletBalance)
            .set({
              balance: () => {
                return event === WithdrawalEvent.COMPLETED ? `balance - ${record.amount}` : `balance`;
              },
              updatedAt: Utils.nowInMillis(),
            })
            .where({
              walletId: record.walletId,
              currency: record.currency,
            })
            .execute(),
          manager
            .createQueryBuilder()
            .update(WalletBalance)
            .set({
              balance: () => `balance - ${fee.toFixed(currency.nativeScale)}`,
              updatedAt: Utils.nowInMillis(),
            })
            .where({
              walletId: withdrawals[0].walletId,
              currency: feeCurrency,
            })
            .execute(),
          rawdb.insertWalletLog(manager, walletLog),
        ]);
      })
    ),
    rawdb.insertWalletLog(manager, withdrawalFeeLog),
  ]);

  return null;
}
