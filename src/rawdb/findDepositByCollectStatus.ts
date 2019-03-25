import { Address, Deposit } from '../entities';
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
    order: {
      updatedAt: 'ASC',
    },
    where: {
      currency: In(currencies),
      collectStatus: In(statuses),
      nextCheckAt: LessThan(now),
      amount: Not(LessThan(amountThreshold)),
    },
  });

  return unCollected;
}

/**
 * Find all deposit with similar toAddress, walletId and currency property
 * @param manager
 * @param currencies
 * @param statuses
 */
export async function findDepositsByCollectStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: CollectStatus[]
): Promise<Deposit[]> {
  // find and filter first group
  const unCollected = await manager.getRepository(Deposit).find({
    order: {
      updatedAt: 'ASC',
    },
    where: {
      currency: In(currencies),
      collectStatus: In(statuses),
    },
  });

  if (!unCollected.length) {
    return [];
  }
  const results = unCollected.filter(deposit => deposit.walletId === unCollected[0].walletId);
  return results;
}

export default findDepositByCollectStatus;
