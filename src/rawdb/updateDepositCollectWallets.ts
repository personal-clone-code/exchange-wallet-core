import { EntityManager } from 'typeorm';
import { WalletEvent, DepositEvent } from '../Enums';
import { WalletBalance, Deposit } from '../entities';

import * as rawdb from './index';
import { Utils, getTokenBySymbol } from 'sota-common';

export async function updateDepositCollectWallets(
  manager: EntityManager,
  deposit: Deposit,
  event: DepositEvent,
  amount: string,
  fee: string,
  isExternal: boolean = false
): Promise<WalletBalance> {
  let walletEvent: WalletEvent;

  let balanceChange: string;
  const walletBalance = await manager.findOne(WalletBalance, {
    walletId: deposit.walletId,
  });

  if (!walletBalance) {
    throw new Error('walletBalance is not existed');
  }

  if (event === DepositEvent.COLLECTED_FAILED) {
    walletEvent = WalletEvent.COLLECTED_FAIL;
    balanceChange = '0';
  }

  if (event === DepositEvent.COLLECTED) {
    walletEvent = WalletEvent.COLLECTED;
    balanceChange = isExternal ? '-' + amount : '0';
  }

  const walletLog = {
    walletId: walletBalance.walletId,
    currency: deposit.currency,
    balanceChange,
    event: walletEvent,
    refId: deposit.id,
  };

  const token = getTokenBySymbol(deposit.currency);
  if (!token) {
    console.log('Cannot find currency configuration for ', deposit.currency);
    throw new Error('Cannot find currency configuration for ' + deposit.currency);
  }
  // find family of the currency to update fee
  const family = token.family;

  const withdrawalFeeLog = {
    walletId: deposit.walletId,
    currency: family,
    balanceChange: `-${fee}`,
    event: WalletEvent.COLLECT_FEE,
    refId: deposit.id,
  };

  await Utils.PromiseAll([
    manager
      .createQueryBuilder()
      .update(WalletBalance)
      .set({
        balance: () => {
          return event === DepositEvent.COLLECTED && isExternal ? `balance - ${deposit.amount}` : `balance`;
        },
        updatedAt: Utils.nowInMillis(),
      })
      .where({
        walletId: deposit.walletId,
        coin: deposit.currency,
      })
      .execute(),
    manager
      .createQueryBuilder()
      .update(WalletBalance)
      .set({
        balance: () => {
          return event === DepositEvent.COLLECTED ? `balance - ${fee}` : `balance`;
        },
        updatedAt: Utils.nowInMillis(),
      })
      .where({
        walletId: deposit.walletId,
        coin: family,
      })
      .execute(),

    rawdb.insertWalletLog(manager, withdrawalFeeLog),
    rawdb.insertWalletLog(manager, walletLog),
  ]);

  return null;
}
