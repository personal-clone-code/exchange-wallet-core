import { getLogger } from 'sota-common';
import { HotWallet } from '../entities';
import { EntityManager } from 'typeorm';
import { InternalTransfer } from '../entities/InternalTransfer';
import { WithdrawalStatus, InternalTransferType } from '../Enums';

const logger = getLogger('rawdb::insertInternalTransfer');

export async function insertInternalTransfer(manager: EntityManager, data: any): Promise<void> {
  await manager.getRepository(InternalTransfer).insert(data);
  console.log({ txid: data.txid });
  return;
}
