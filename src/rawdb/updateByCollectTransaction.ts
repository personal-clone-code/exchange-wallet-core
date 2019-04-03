import { EntityManager } from 'typeorm';
import { WalletEvent, DepositEvent } from '../Enums';
import { WalletBalance, Deposit } from '../entities';

import * as rawdb from './index';
import { Utils, getTokenBySymbol, Transaction } from 'sota-common';

export async function updateByCollectTransaction(
  manager: EntityManager,
  deposits: Deposit[],
  event: DepositEvent,
  tx: Transaction,
  isExternal: boolean = false
): Promise<WalletBalance> {
  const fee = tx.getNetworkFee();
  const outputs = tx.extractTransferOutputs();
  const amount = outputs[0].amount; // assume one output
  const depositCurrency = deposits[0].currency;
  const walletId = deposits[0].walletId;
  let walletLogEvent: WalletEvent;

  let balanceChange: string;
  const walletBalance = await manager.findOne(WalletBalance, {
    walletId,
  });

  if (!walletBalance) {
    throw new Error('walletBalance is not existed');
  }

  if (event === DepositEvent.COLLECTED_FAILED) {
    walletLogEvent = WalletEvent.COLLECTED_FAIL;
    balanceChange = '0';
  }

  if (event === DepositEvent.COLLECTED) {
    walletLogEvent = WalletEvent.COLLECTED;
    balanceChange = isExternal ? '-' + amount : '0';
  }

  const walletLog = {
    walletId: walletBalance.walletId,
    currency: depositCurrency,
    balanceChange,
    event: walletLogEvent,
    refId: deposits.map(deposit => deposit.id),
  };

  const token = getTokenBySymbol(depositCurrency);
  if (!token) {
    console.log('Cannot find currency configuration for ', depositCurrency);
    throw new Error('Cannot find currency configuration for ' + depositCurrency);
  }
  // find family of the currency to update fee
  const family = token.family;

  const collectFeeLog = {
    walletId,
    currency: family,
    balanceChange: `-${fee}`,
    event: WalletEvent.COLLECT_FEE,
    refId: deposits.map(deposit => deposit.id),
  };

  await Utils.PromiseAll([
    manager
      .createQueryBuilder()
      .update(WalletBalance)
      .set({
        balance: () => {
          return event === DepositEvent.COLLECTED && isExternal ? `balance - ${amount}` : `balance`;
        },
        updatedAt: Utils.nowInMillis(),
      })
      .where({
        walletId,
        coin: depositCurrency,
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
        walletId,
        coin: family,
      })
      .execute(),

    rawdb.insertWalletLog(manager, collectFeeLog),
    rawdb.insertWalletLog(manager, walletLog),
  ]);

  return null;
}
