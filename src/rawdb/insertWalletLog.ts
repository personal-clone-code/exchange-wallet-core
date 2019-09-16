import { EntityManager } from 'typeorm';
import { WalletLog } from '../entities';
import { Utils } from 'sota-common';

interface IWalletLogData {
  walletId: number;
  currency: string;
  refCurrency: string;
  balanceChange: string;
  event: string;
  refId: number;
}

export async function insertWalletLog(manager: EntityManager, data: WalletLog): Promise<void> {
  data.createdAt = Utils.nowInMillis();
  data.updatedAt = Utils.nowInMillis();
  await manager.getRepository(WalletLog).insert(data);
  return;
}

export default insertWalletLog;
