import * as _ from 'lodash';
import { EntityManager } from 'typeorm';
import { IRawTransaction, Utils, BigNumber } from 'sota-common';
import { HotWallet, LocalTx, Withdrawal, Deposit, Address } from '../entities';
import { WithdrawalStatus, WithdrawalEvent, RefTable, LocalTxType, LocalTxStatus } from '../Enums';
import * as rawdb from './index';

/**
 * Update withdrawals and insert LocalTx by unsignedTx value
 *
 * @param manager
 * @param unsignedTx
 * @param senderWallet
 * @param withdrawalIds
 */
export async function doPickingWithdrawals(
  manager: EntityManager,
  unsignedTx: IRawTransaction,
  senderWallet: HotWallet | Address,
  currency: string,
  withdrawals: Withdrawal[],
  localTxType?: LocalTxType
  // amount: BigNumber
): Promise<LocalTx> {
  const withdrawalIds = withdrawals.map(w => w.id);
  // const withdrawalAddresses = withdrawals.map(w => w.toAddress);
  let withdrawalAmount = new BigNumber(0);
  withdrawals.map(withdrawal => {
    withdrawalAmount = withdrawalAmount.plus(withdrawal.amount);
  });

  // Create local tx record
  const localTx = await rawdb.insertLocalTx(manager, {
    fromAddress: senderWallet.address,
    toAddress: 'FIND_IN_WITHDRAWAL',
    userId: withdrawals[0].userId,
    walletId: withdrawals[0].walletId,
    currency,
    refCurrency: withdrawals[0].currency,
    refId: 0,
    refTable: RefTable.WITHDRAWAL,
    type: localTxType || LocalTxType.WITHDRAWAL_NORMAL,
    status: LocalTxStatus.SIGNING,
    unsignedRaw: unsignedTx.unsignedRaw,
    unsignedTxid: unsignedTx.txid,
    amount: withdrawalAmount.toString(),
  });

  // update withdrawal record
  const updatedValue = {
    withdrawalTxId: localTx.id,
    status: WithdrawalStatus.SIGNING,
    fromAddress: senderWallet.address,
    updatedAt: Utils.nowInMillis(),
  };

  await Utils.PromiseAll([
    manager.update(Withdrawal, withdrawalIds, updatedValue),
    rawdb.insertWithdrawalLogs(manager, withdrawalIds, WithdrawalEvent.PICKED, localTx.id, localTx.txid),
  ]);

  return localTx;
}

export default doPickingWithdrawals;
