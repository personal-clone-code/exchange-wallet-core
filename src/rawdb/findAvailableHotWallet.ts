import { Currency } from 'sota-common';
import { getLogger } from 'sota-common';
import { HotWallet } from '../entities';
import { EntityManager } from 'typeorm';
import { bool } from 'aws-sdk/clients/signer';

const logger = getLogger('rawdb::findAvailableHotWallet');

export async function findAvailableHotWallet(
  manager: EntityManager,
  currency: string,
  isExternal: boolean
): Promise<HotWallet> {
  // TODO: find available hot wallet only
  const hotWallet = await manager.findOne(HotWallet, {
    currency,
    isExternal,
  });
  return hotWallet;
}
