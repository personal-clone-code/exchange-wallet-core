import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WalletEvent, DepositEvent, CollectStatus, WithdrawalStatus } from '../Enums';
import { WalletBalance, Withdrawal, WithdrawalTx, Deposit } from '../entities';

import * as rawdb from './index';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function updateInternalTransfer(
  manager: EntityManager,
  transfer: InternalTransfer,
  status: CollectStatus,
  amount: string,
  fee: string,
  walletId: number
): Promise<InternalTransfer> {
  transfer.amount = amount;
  transfer.fee = fee;
  transfer.status = status === CollectStatus.COLLECTED ? WithdrawalStatus.COMPLETED : WithdrawalStatus.FAILED;
  transfer.walletId = walletId;
  return manager.save(transfer);
}
