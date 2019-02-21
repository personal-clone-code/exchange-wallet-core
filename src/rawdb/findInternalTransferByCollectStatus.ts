import { EntityManager, In } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
import { InternalTransfer } from '../entities/InternalTransfer';

export async function findInternalTransferByCollectStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: WithdrawalStatus[]
): Promise<InternalTransfer> {
  const unCollected = await manager.getRepository(InternalTransfer).findOne({
    currency: In(currencies),
    status: In(statuses),
  });

  return unCollected;
}

export default findInternalTransferByCollectStatus;
