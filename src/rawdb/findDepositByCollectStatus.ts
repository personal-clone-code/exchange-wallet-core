import { Deposit } from '../entities';
import { EntityManager, In, LessThan, Not } from 'typeorm';
import { CollectStatus } from '../Enums';
import { TransferType } from 'sota-common';

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
 * @param manager
 * @param currencies
 * @param statuses
 * @param transferType
 */
export async function findDepositsByCollectStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: CollectStatus[],
  transferType: TransferType
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
  // find all results that have similar toAddress
  if (transferType === TransferType.ACCOUNT_BASED) {
    // 1. Account base
    return results.filter(deposit => deposit.toAddress === results[0].toAddress);
  } else if (transferType === TransferType.UTXO_BASED) {
    // 2. UTXO based type
    return results;
  }
  return results;
}

export default findDepositByCollectStatus;
