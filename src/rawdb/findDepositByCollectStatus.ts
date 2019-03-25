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
 * that can be group amount
 * TODO: update transfer type
 * @param manager
 * @param currencies
 * @param statuses
 */
export async function findDepositsByCollectStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: CollectStatus[],
  transferType: boolean
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
  let results = unCollected.filter(deposit => deposit.walletId === unCollected[0].walletId);
  // find all results that have similar toAddress
  if (transferType) {
    // 1. Account base
    results = results.filter(deposit => deposit.toAddress === results[0].toAddress);
  }
  // 2. UTXO based type

  return results;
}

export default findDepositByCollectStatus;
