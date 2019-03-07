import { HotWallet } from '../entities';
import { EntityManager } from 'typeorm';

/**
 * Get a hot wallet that has no pending transaction
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findHotWallet(manager: EntityManager, address: string): Promise<HotWallet> {
  // TODO: find available hot wallet only
  const hotWallet = await manager.findOne(HotWallet, {
    address,
  });

  return hotWallet;
}
