import { ISubmittedTransaction } from 'sota-common';
import { WithdrawalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';

export async function updateWithdrawalTxStatus(
  manager: EntityManager,
  id: number,
  status: WithdrawalStatus,
  transactionResult?: ISubmittedTransaction,
  fee?: string
): Promise<WithdrawalTx> {
  // Find wallet of record
  const record = await manager.findOne(WithdrawalTx, id);
  record.status = status;
  if (transactionResult) {
    if (transactionResult.hasOwnProperty('txid')) {
      record.txid = transactionResult.txid;
    }

    if (transactionResult.hasOwnProperty('blockNumber')) {
      record.blockNumber = transactionResult.blockNumber;
    }
  }
  if (fee) {
    record.feeAmount = fee;
  }

  await manager.save(record);
  return record;
}
