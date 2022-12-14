import * as _ from 'lodash';
import { Address } from '../../entities';
import { BaseCrawler, CurrencyRegistry } from 'sota-common';
import { getConnection } from 'typeorm';

/**
 * This callback is get all addresses of currency
 * @param typeCurrency
 */
export default async function getAddressesDepositCrawler(crawler: BaseCrawler): Promise<string[]> {
  const currency =  crawler.getNativeCurrency().family || crawler.getNativeCurrency().symbol;

  // Look up in database
  const connection = await getConnection();
  const repository = connection.getRepository(Address);
  const addresses = await repository.find({ currency });

  // If the record is existed, return it
  return _.map(addresses, 'address');
}

export { getAddressesDepositCrawler };
