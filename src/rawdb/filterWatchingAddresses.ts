import _ from 'lodash';
import { ICurrency } from 'sota-common';
import { EntityManager, In } from 'typeorm';
import { Address } from '../entities';

/**
 * Filter and return only the addresses that we're watching (which are currently stored in address tables)
 *
 * @param {string[]} addresses - array of addresses that need to be filtered
 * @returns {string[]} filtered addresses
 */
export async function filterWatchingAddresses(
  manager: EntityManager,
  c: ICurrency,
  addresses: string[]
): Promise<string[]> {
  if (addresses.length === 0) {
    return [];
  }

  const watchingAddresses = await manager.getRepository(Address).find({ currency: c.symbol, address: In(addresses) });
  const result = watchingAddresses.map(a => a.address);
  return _.compact(_.uniq(result));
}

export default filterWatchingAddresses;
