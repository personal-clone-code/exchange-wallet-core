import { getLogger, Utils } from 'sota-common';
import { Withdrawal, Deposit, Wallet } from '../entities';
import { EntityManager } from 'typeorm';
import insertWebhookProgress from './insertWebhookProgress';
import { WebhookType, WithdrawalEvent, WithdrawalStatus, CollectStatus, DepositEvent } from '../Enums';
import insertWithdrawalLog from './insertWithdrawalLog';

const logger = getLogger('rawdb::updateDepositCollectWebhook');

export async function updateDepositCollectWebhook(
  manager: EntityManager,
  id: number,
  event: DepositEvent
): Promise<Deposit[]> {
  // Find wallet of record
  const records = await manager.find(Deposit, { id });
  await Utils.PromiseAll(
    records.map(async record => {
      const wallet = await manager.getRepository(Wallet).findOne({ id: record.walletId });
      return insertWebhookProgress(manager, wallet.userId, WebhookType.DEPOSIT, record.id, event);
      // return insertWithdrawalLog(manager, newRecord.txid, newRecord.id, event);
    })
  );
  return records;
}
