import { EntityManager, In } from 'typeorm';
import { LocalTx, Deposit } from '../entities';
import { LocalTxType, LocalTxStatus, CollectStatus } from '../Enums';

export async function hasAnySeedRequestedToAddress(manager: EntityManager, address: string): Promise<boolean> {
  const pendingSeedRecord = await manager.getRepository(LocalTx).findOne({
    where: {
      toAddress: address,
      type: LocalTxType.SEED,
      status: In([LocalTxStatus.SIGNING, LocalTxStatus.SIGNED, LocalTxStatus.SENT]),
    },
  });
  if (pendingSeedRecord) {
    return true;
  }
  const seedRequestedRecord = await manager.getRepository(Deposit).findOne({
    where: {
      toAddress: address,
      collectStatus: In([CollectStatus.SEED_REQUESTED]),
    },
  });
  if (seedRequestedRecord) {
    return true;
  }
  return false;
}

export async function seedRecordToAddressIsExist(manager: EntityManager, address: string): Promise<boolean>{
  const seedTxRecord = await manager.getRepository(LocalTx).findOne({
    where: {
      toAddress: address,
      type: LocalTxType.SEED,
      status: In([LocalTxStatus.SIGNING, LocalTxStatus.SIGNED, LocalTxStatus.SENT, LocalTxStatus.COMPLETED]),
    },
  });
  if (seedTxRecord) {
    return true;
  }

  const seedRequestRecord = await manager.getRepository(Deposit).findOne({
    where: {
      toAddress: address,
      collectStatus: In([CollectStatus.SEEDING,CollectStatus.SEED_SIGNED, CollectStatus.SEED_SENT, ]),
    },
  });
  if (seedRequestRecord) {
    return true;
  }
  return false;
}