import { Deposit } from '../entities';
import { EntityManager, In, Not, LessThan } from 'typeorm';
import { CollectStatus } from '../Enums';

export async function findDepositByCollectStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: CollectStatus[],
  amountThreshold: string = '0'
): Promise<Deposit> {
  const now = Date.now();
  const unCollected = await manager.getRepository(Deposit).findOne({
    where: {
      currency: In(currencies),
      collectStatus: In(statuses),
      nextCheckAt: LessThan(now),
      amount: Not(LessThan(amountThreshold)),
    },
  });

  return unCollected;
}

export default findDepositByCollectStatus;
