import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent } from '../Enums';
import { WalletBalance, Withdrawal, WithdrawalTx } from '../entities';

import * as rawdb from './index';
import { Utils, getTokenBySymbol } from 'sota-common';

export async function updateWithdrawalTxWallets(
  manager: EntityManager,
  withdrawalTx: WithdrawalTx,
  event: WithdrawalEvent.COMPLETED | WithdrawalEvent.FAILED,
  fee: string
): Promise<WalletBalance> {
  const withdrawals = await manager.find(Withdrawal, {
    withdrawalTxId: withdrawalTx.id,
  });

  let walletEvent: WalletEvent;

  await Utils.PromiseAll(
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

      const walletLog = {
        walletId: walletBalance.walletId,
        currency: withdrawalTx.currency,
        balanceChange,
        event: walletEvent,
        refId: record.id,
      };

      const currency = getTokenBySymbol(record.currency);
      if (!currency) {
        console.log('Cannot find currency configuration for ', record.currency);
        throw new Error('Cannot find currency configuration for ' + record.currency);
      }

      const familyCurrency = currency.family;

      const withdrawalFeeLog = {
        walletId: withdrawals[0].walletId,
        currency: familyCurrency,
        balanceChange: `-${fee}`,
        event: WalletEvent.WITHDRAW_FEE,
        refId: withdrawalTx.id,
      };

      await Utils.PromiseAll([
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
            coin: record.currency,
          })
          .execute(),
        manager
          .createQueryBuilder()
          .update(WalletBalance)
          .set({
            balance: () => `balance - ${fee}`,
            updatedAt: Utils.nowInMillis(),
          })
          .where({
            walletId: withdrawals[0].walletId,
            coin: familyCurrency,
          })
          .execute(),

        rawdb.insertWalletLog(manager, withdrawalFeeLog),
        rawdb.insertWalletLog(manager, walletLog),
      ]);
    })
  );

  return null;
}
