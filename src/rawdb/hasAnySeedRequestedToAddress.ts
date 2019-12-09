import { EntityManager, In } from 'typeorm';
import { LocalTx } from '../entities';
import { LocalTxType, LocalTxStatus } from '../Enums';

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
  return false;
}
