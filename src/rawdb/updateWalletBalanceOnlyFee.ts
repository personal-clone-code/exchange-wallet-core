import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent, DepositEvent, WithdrawalStatus, CollectStatus } from '../Enums';
import { WalletBalance, Withdrawal, WithdrawalTx, Deposit, Address } from '../entities';

import * as rawdb from './index';
import { Utils } from 'sota-common';
import { stat } from 'fs';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function updateWalletBalanceOnlyFee(
  manager: EntityManager,
  transfer: InternalTransfer,
  address: Address,
  status: CollectStatus,
  fee: string
): Promise<WalletBalance> {
  let walletEvent: WalletEvent;
  let balanceChange: string;
  const walletBalance = await manager.findOne(WalletBalance, {
    walletId: address.walletId,
  });

  if (!walletBalance) {
    console.log('walletBalance is not existed');
    throw new Error('walletBalance is not existed');
  }

  if (status === CollectStatus.UNCOLLECTED) {
    walletEvent = WalletEvent.SEEDED_FAIL;
    balanceChange = '0';
  }

  if (status === CollectStatus.COLLECTED) {
    walletEvent = WalletEvent.SEEDED;
    balanceChange = '-' + fee;
  }

  const withdrawalFeeLog = {
    walletId: address.walletId,
    currency: address.currency,
    balanceChange,
    event: WalletEvent.SEED_FEE,
    refId: transfer.id,
  };

  await Utils.PromiseAll([
    manager
      .createQueryBuilder()
      .update(WalletBalance)
      .set({
        balance: () => {
          return status === CollectStatus.COLLECTED ? `balance - ${fee}` : `balance`;
        },
        updatedAt: Utils.nowInMillis(),
      })
      .where({
        walletId: address.walletId,
        coin: address.currency === 'erc20' ? 'eth' : address.currency,
      })
      .execute(),

    rawdb.insertWalletLog(manager, withdrawalFeeLog),
  ]);

  return null;
}
