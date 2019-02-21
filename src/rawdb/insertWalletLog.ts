import { EntityManager } from 'typeorm';
import { WalletLog } from '../entities';
import { Utils } from 'sota-common';

export async function insertWalletLog(manager: EntityManager, data: any): Promise<void> {
  data.createdAt = Utils.nowInMillis();
  data.updatedAt = Utils.nowInMillis();
  await manager.getRepository(WalletLog).insert(data);
  return;
}

export default insertWalletLog;
