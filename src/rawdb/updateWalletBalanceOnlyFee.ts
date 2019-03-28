import { EntityManager } from 'typeorm';
import { WalletEvent, CollectStatus } from '../Enums';
import { WalletBalance } from '../entities';

import * as rawdb from './index';
import { getTokenBySymbol, Utils } from 'sota-common';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function updateWalletBalanceOnlyFee(
  manager: EntityManager,
  transfer: InternalTransfer,
  status: CollectStatus,
  fee: string
): Promise<WalletBalance> {
  let walletEvent: WalletEvent;
  let balanceChange: string;
  const walletBalance = await manager.findOne(WalletBalance, {
    walletId: transfer.walletId,
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
    walletId: transfer.walletId,
    currency: transfer.currency,
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
        walletId: transfer.walletId,
        coin: getTokenBySymbol(transfer.currency).family,
      })
      .execute(),

    rawdb.insertWalletLog(manager, withdrawalFeeLog),
  ]);

  return null;
}
