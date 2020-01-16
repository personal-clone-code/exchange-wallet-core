import { EntityManager, In } from 'typeorm';
import { Deposit } from '../entities';
import { LocalTxType, CollectStatus, WithdrawalStatus } from '../Enums';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function hasAnySeedRequestedToAddress(manager: EntityManager, address: string): Promise<boolean> {
  const pendingSeedRecord = await manager.getRepository(InternalTransfer).findOne({
    where: {
      toAddress: address,
      type: LocalTxType.SEED,
      status: In([WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT]),
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