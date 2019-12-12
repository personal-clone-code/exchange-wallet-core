import { EntityManager, In } from 'typeorm';
import { LocalTx, Deposit } from '../entities';
import { LocalTxType, LocalTxStatus, CollectStatus } from '../Enums';

export async function hasAnySeedRequestedToAddressInLocalTx(manager: EntityManager, address: string): Promise<boolean> {
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
  return false;
}

export async function hasAnySeedRequestedToAddressInDeposit(manager: EntityManager, address: string): Promise<boolean> {
  const pendingSeedRecord = await manager.getRepository(Deposit).findOne({
    where: {
      toAddress: address,
      collectStatus: In([CollectStatus.SEED_REQUESTED]),
    },
  });
  if (pendingSeedRecord) {
    return true;
  }
  return false;
}
