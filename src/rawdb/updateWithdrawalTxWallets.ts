import { BigNumber, CurrencyRegistry } from 'sota-common';
import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent } from '../Enums';
import { WalletBalance, Withdrawal, WithdrawalTx, WalletLog } from '../entities';

import * as rawdb from './index';
import { Utils } from 'sota-common';

export async function updateWithdrawalTxWallets(
  manager: EntityManager,
  withdrawalTx: WithdrawalTx,
  event: WithdrawalEvent.COMPLETED | WithdrawalEvent.FAILED,
  fee: BigNumber
): Promise<WalletBalance> {
  const withdrawals = await manager.find(Withdrawal, {
    withdrawalTxId: withdrawalTx.id,
  });

  let walletEvent: WalletEvent;
  const feeCurrency = CurrencyRegistry.getOneCurrency(withdrawalTx.currency).platform;

  if (!withdrawals.length) {
    return null;
  }

  const withdrawalFeeLog = new WalletLog();
  withdrawalFeeLog.walletId = withdrawals[0].walletId;
  withdrawalFeeLog.currency = feeCurrency;
  withdrawalFeeLog.refCurrency = withdrawalTx.currency;
  withdrawalFeeLog.balanceChange = `-${fee}`;
  withdrawalFeeLog.event = WalletEvent.WITHDRAW_FEE;
  withdrawalFeeLog.refId = withdrawalTx.id;
  const tasks: Array<Promise<any>> = [];
  tasks.push(
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
        walletLog.currency = withdrawalTx.currency;
        walletLog.refCurrency = withdrawalTx.currency;
        walletLog.balanceChange = balanceChange;
        walletLog.event = walletEvent;
        walletLog.refId = record.id;

        const currency = CurrencyRegistry.getOneCurrency(record.currency);
        return Utils.PromiseAll([
          manager
            .createQueryBuilder()
            .update(WalletBalance)
            .set({
              balance: () => {
                return event === WithdrawalEvent.FAILED ? `balance + ${record.amount}` : `balance`;
              },
              withdrawalPending: () => {
                return `withdrawal_pending - ${record.amount}`;
              },
              withdrawalTotal: () => {
                return event === WithdrawalEvent.COMPLETED ? `withdrawal_total + ${record.amount}` : `withdrawal_total`;
              },
              updatedAt: Utils.nowInMillis(),
            })
            .where({
              walletId: record.walletId,
              currency: record.currency,
            })
            .execute(),
          rawdb.insertWalletLog(manager, walletLog),
        ]);
      })
    )
  );
  if (event === WithdrawalEvent.COMPLETED) {
    tasks.push(rawdb.insertWalletLog(manager, withdrawalFeeLog));
    tasks.push(
      manager
        .createQueryBuilder()
        .update(WalletBalance)
        .set({
          balance: () => `balance - ${fee.toFixed(CurrencyRegistry.getOneCurrency(feeCurrency).nativeScale)}`,
          updatedAt: Utils.nowInMillis(),
        })
        .where({
          walletId: withdrawals[0].walletId,
          currency: feeCurrency,
        })
        .execute()
    );
  }
  await Utils.PromiseAll(tasks);
  return null;
}
