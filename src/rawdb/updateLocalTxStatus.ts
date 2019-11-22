import { ISubmittedTransaction, BigNumber, BlockHeader } from 'sota-common';
import { LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { LocalTxStatus } from '../Enums';

export async function updateLocalTxStatus(
  manager: EntityManager,
  id: number,
  status: LocalTxStatus,
  transactionResult?: ISubmittedTransaction,
  fee?: BigNumber,
  blockHeader?: BlockHeader
): Promise<LocalTx> {
  // Find wallet of record
  const record = await manager.findOne(LocalTx, id);
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
    record.feeAmount = fee.toFixed();
  }

  if (blockHeader) {
    record.blockNumber = blockHeader.number;
    record.blockHash = blockHeader.hash;
    record.blockTimestamp = blockHeader.timestamp;
  }

  await manager.save(record);
  return record;
}
