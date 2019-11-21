import { Utils } from 'sota-common';
import { Deposit, LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { CollectStatus, DepositEvent } from '../Enums';
import { insertDepositLog } from './insertDepositLog';

async function updateDepositCollectStatus(
  manager: EntityManager,
  transaction: LocalTx,
  status: CollectStatus,
  event: DepositEvent,
  type: string
): Promise<void> {
  const whereColId = type === 'seed' ? 'seedLocalTxId' : 'collectLocalTxId';
  const records = await manager.find(Deposit, {
    [whereColId]: transaction.id,
  });
  const tasks: Array<Promise<any>> = [];
  records.map(record => {
    tasks.push(insertDepositLog(manager, record.id, event, transaction.id));
  });
  tasks.push(
    manager.update(
      Deposit,
      { [whereColId]: transaction.id },
      { collectStatus: status, collectedTimestamp: transaction.updatedAt }
    )
  );
  await Utils.PromiseAll(tasks);
}

export async function updateDepositCollectStatusBySeedTxId(
  manager: EntityManager,
  transaction: LocalTx,
  status: CollectStatus,
  event: DepositEvent
): Promise<void> {
  await updateDepositCollectStatus(manager, transaction, status, event, 'seed');
}

export async function updateDepositCollectStatusByCollectTxId(
  manager: EntityManager,
  transaction: LocalTx,
  status: CollectStatus,
  event: DepositEvent
): Promise<void> {
  await updateDepositCollectStatus(manager, transaction, status, event, 'collect');
}
