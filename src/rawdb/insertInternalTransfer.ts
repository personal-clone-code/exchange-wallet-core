import { EntityManager } from 'typeorm';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function insertInternalTransfer(manager: EntityManager, data: any): Promise<void> {
  await manager.getRepository(InternalTransfer).insert(data);
  console.log({ txid: data.txid });
  return;
}
