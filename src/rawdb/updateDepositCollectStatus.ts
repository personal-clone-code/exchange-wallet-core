import { WithdrawalTx, Deposit } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus, CollectStatus } from '../Enums';

export async function updateDepositCollectStatus(
  manager: EntityManager,
  id: number,
  status: CollectStatus,
  timestamp: number
): Promise<Deposit> {
  // Find wallet of record
  const record = await manager.findOne(Deposit, id);
  record.collectStatus = status;
  record.collectedTimestamp = timestamp;

  await manager.save(record);
  return record;
}
