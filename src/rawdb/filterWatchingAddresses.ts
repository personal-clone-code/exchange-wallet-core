import { EntityManager, In } from 'typeorm';
import { Address } from '../entities';
import { Currency } from 'sota-common';

/**
 * Filter and return only the addresses that we're watching (which are currently stored in address tables)
 *
 * @param {Currency} currency - the symbol of currency
 * @param {string[]} addresses - array of addresses that need to be filtered
 * @returns {string[]} filtered addresses
 */
export async function filterWatchingAddresses(
  manager: EntityManager,
  currency: string,
  addresses: string[]
): Promise<string[]> {
  if (addresses.length === 0) {
    return [];
  }

  const watchingAddresses = await manager.getRepository(Address).find({ currency, address: In(addresses) });
  return watchingAddresses.map(a => a.address);
}

export default filterWatchingAddresses;
