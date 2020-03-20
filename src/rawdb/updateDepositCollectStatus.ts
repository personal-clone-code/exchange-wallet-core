import { Utils, GatewayRegistry } from 'sota-common';
import { Deposit, LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { CollectStatus, DepositEvent } from '../Enums';
import { insertDepositLog } from './insertDepositLog';
import { updateAddressBalance } from '.';

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

export async function updateDepositCollectStatusByWithdrawalTxId(
  manager: EntityManager,
  transaction: LocalTx,
  withdrawal_id,
  status: CollectStatus,
  event: DepositEvent
): Promise<void> {
  const records = await manager.getRepository(Deposit).find({
    where: {
      collectWithdrawalId: withdrawal_id,
    },
  });
  const tasks: Array<Promise<any>> = [];
  records.map(record => {
    tasks.push(insertDepositLog(manager, record.id, event, transaction.id));
  });
  tasks.push(
    manager.update(
      Deposit,
      { collectWithdrawalId: withdrawal_id },
      {
        collectStatus: status,
        collectedTimestamp: transaction.updatedAt,
        collectLocalTxId: transaction.id,
        collectedTxid: transaction.txid,
      }
    )
  );
  const tx = await GatewayRegistry.getGatewayInstance(transaction.currency).getOneTransaction(transaction.txid);
  tasks.push(updateAddressBalance(manager, tx));
  await Utils.PromiseAll(tasks);
}
