import { BaseCrawler, Block, getListTokenSymbols, Utils } from 'sota-common';
import { getConnection } from 'typeorm';
import { LatestBlock } from '../../entities/LatestBlock';
/**
 * This callback is invoked when a block is processed. We'll update latest_block table then
 * @param {BaseCrawler} crawler: the crawler that is processing
 * @param {Block} block: the block data that has been crawled
 */
export default async function onBlockCrawled(crawler: BaseCrawler, block: Block): Promise<void> {
  const tokens: string[] = getListTokenSymbols().tokenSymbols;
  const type = crawler.getCrawlType();
  const blockNumber = block.number;

  await Utils.PromiseAll(
    tokens.map(async tokenSymbol => {
      await getConnection()
        .createQueryBuilder()
        .update(LatestBlock)
        .set({ blockNumber })
        .where({ currency: tokenSymbol, type })
        .execute();
    })
  );
}

export { onBlockCrawled };
