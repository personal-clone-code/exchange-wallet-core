import * as _ from 'lodash';
import { BigNumber, CurrencyRegistry, getLogger } from 'sota-common';
import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent } from '../Enums';
import { WalletBalance, WalletLog, Withdrawal, LocalTx, Address, HotWallet } from '../entities';

import * as rawdb from './index';
import { Utils } from 'sota-common';
const logger = getLogger(`updateWithdrawalTxWallets`);
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
  const currency = CurrencyRegistry.getOneCurrency(localTx.currency);
  const feeCurrency = CurrencyRegistry.getOneCurrency(localTx.currency).platform;

  if (!withdrawals.length) {
    return null;
  }

  let minusFee = false;

  const tasks: Array<Promise<any>> = _.map(withdrawals, async record => {
    const toAddress = record.toAddress;
    const fromAddress = record.fromAddress;

    const toAddressRecord = await manager
      .getRepository(HotWallet)
      .findOne({ address: toAddress, walletId: record.walletId });
    const fromAddressRecord = await manager
      .getRepository(HotWallet)
      .findOne({ address: fromAddress, walletId: record.walletId });

    // TODO only for case withdraw and only correct if withdraw from one address
    minusFee = fromAddressRecord ? true : false;

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
      if (fromAddressRecord && !toAddressRecord) {
        if (currency.isNative) {
          const balanceAfter = new BigNumber(record.amount).minus(fee);
          balanceChange = `-${balanceAfter.lte(0) ? record.amount : balanceAfter.toString()}`;
        } else {
          balanceChange = '-' + record.amount;
        }
      } else if (!fromAddressRecord && toAddressRecord) {
        if (currency.isNative) {
          const balanceAfter = new BigNumber(record.amount).minus(fee);
          balanceChange = `+${balanceAfter.lte(0) ? record.amount : balanceAfter.toString()}`;
        } else {
          balanceChange = '+' + record.amount;
        }
      }
    }
    const walletLog = new WalletLog();
    walletLog.walletId = walletBalance.walletId;
    walletLog.currency = localTx.currency;
    walletLog.refCurrency = localTx.currency;
    walletLog.balanceChange = balanceChange;
    walletLog.event = walletEvent;
    walletLog.refId = record.id;

    await Utils.PromiseAll([
      manager
        .createQueryBuilder()
        .update(WalletBalance)
        .set({
          balance: () => {
            if (event === WithdrawalEvent.COMPLETED) {
              if (currency.isNative) {
                const walletBalanceAfter = new BigNumber(record.amount).minus(fee);
                return `balance - ${walletBalanceAfter.lte(0) ? record.amount : walletBalanceAfter.toString()}`;
              }
              return `balance - ${record.amount}`;
            }
            return `balance`;
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
  });

  if (event === WithdrawalEvent.COMPLETED && minusFee) {
    const withdrawalFeeLog = new WalletLog();
    withdrawalFeeLog.walletId = withdrawals[0].walletId;
    withdrawalFeeLog.currency = feeCurrency;
    withdrawalFeeLog.refCurrency = localTx.currency;
    withdrawalFeeLog.balanceChange = `-${fee}`;
    withdrawalFeeLog.event = WalletEvent.WITHDRAW_FEE;
    withdrawalFeeLog.refId = localTx.id;
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
    tasks.push(rawdb.insertWalletLog(manager, withdrawalFeeLog));
  }
  await Promise.all(tasks);
  return null;
}
