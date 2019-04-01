import { LatestBlock } from '../../entities';
import { BaseCrawler, getListTokenSymbols } from 'sota-common';
import { EntityManager, getConnection, In } from 'typeorm';

/**
 * This callback is invoked when a block is processed. We'll update latest_block table then
 * @param currency
 * @param type
 * @param blockNumber
 */
export default async function getLatestCrawledBlockNumber(crawler: BaseCrawler): Promise<number> {
  const type = 'deposit';
  // Look up in database
  const connection = await getConnection();
  let result: number = 0;
  await connection.transaction(async manager => {
    result = await _updateLatestBlock(manager, type, crawler);
  });
  return result;
}

async function _updateLatestBlock(manager: EntityManager, type: string, crawler: BaseCrawler): Promise<number> {
  const tokens: string[] = getListTokenSymbols().tokenSymbols;
  const repository = manager.getRepository(LatestBlock);
  const allLatestBlocks = await repository.find({ currency: In(tokens), type });

  const blockNumbers: number[] = await Promise.all(
    tokens.map(async tokenSymbol => {
      // create new latest block record
      const record = new LatestBlock();
      record.blockNumber = crawler.getFirstBlockNumberToCrawl();
      if (allLatestBlocks.length) {
        const maxLatest = Math.max(...allLatestBlocks.map(tokenLatestRec => tokenLatestRec.blockNumber));
        record.blockNumber = maxLatest;
      }
      record.type = type;

      const tokenLatestBlock = await repository.findOne({ currency: tokenSymbol, type });
      // If the record is existed, return the result
      if (tokenLatestBlock) {
        return tokenLatestBlock.blockNumber;
      }

      record.currency = tokenSymbol;
      await repository.save(record);

      return record.blockNumber;
    })
  );

  const latestBlock = Math.min(...blockNumbers);
  return latestBlock;
}

export { getLatestCrawledBlockNumber };
