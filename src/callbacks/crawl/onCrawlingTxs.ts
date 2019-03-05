import { Transaction, BaseCrawler, getFamily, Transactions, Utils } from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';

/**
 * This callback is invoked to processing all transactions of crawling blocks
 * @param {BaseCrawler} crawler - the crawler that is processing
 * @param {Transactions} allTxs - all transactions that are being crawled and need to process
 *
 * @returns {Transactions} list of transactions that are being watched
 */
export default async function onCrawlingTxs(crawler: BaseCrawler, allTxs: Transactions): Promise<void> {
  const connection = getConnection();
  await connection.transaction(async manager => {
    await _onCrawlingTxs(manager, crawler, allTxs);
  });
}

// Proxy function behind the transaction
async function _onCrawlingTxs(manager: EntityManager, crawler: BaseCrawler, allTxs: Transactions): Promise<void> {
  // Key transactions by hash and address for looking up later
  const txsByAddress = allTxs.groupByRecipients();

  // Get all addresses that are involved in the transactions
  const allAddresses: string[] = Array.from(txsByAddress.keys());

  // Filter out related addresses
  const watchingAddresses = await rawdb.filterWatchingAddresses(manager, getFamily(), allAddresses);
  // Ger related transactions
  const watchingTxs = watchingAddresses.reduce((memo, watchingAddress) => {
    return memo.concat(txsByAddress.get(watchingAddress));
  }, new Transactions());

  const uniqueListTxs = Array.from(new Set(watchingTxs.map((tx: Transaction) => tx)));
  const txProcessed = new Map<string, boolean>();

  // Process every single deposit transaction
  const tasks = uniqueListTxs.map(async watchingTx => {
    if (!watchingTx) {
      return;
    }

    // Prevent process one transaction multiple times
    if (txProcessed.get(watchingTx.txid)) {
      return;
    }

    txProcessed.set(watchingTx.txid, true);

    return rawdb.processOneDepositTransaction(manager, crawler, watchingTx, watchingAddresses);
  });

  await Utils.PromiseAll(tasks);
}

export { onCrawlingTxs };
