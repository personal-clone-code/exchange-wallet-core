import { HotWallet } from '../entities';
import { EntityManager } from 'typeorm';

/**
 * Get a hot wallet that has no pending transaction
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findAvailableHotWallet(
  manager: EntityManager,
  userId: number,
  currency: string,
  isExternal: boolean
): Promise<HotWallet> {
  // TODO: find available hot wallet only
  const hotWallet = await manager.findOne(HotWallet, {
    userId,
    currency,
    isExternal,
  });
  return hotWallet;
}
