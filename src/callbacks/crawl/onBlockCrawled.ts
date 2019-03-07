import { BaseCrawler, Block, getListTokenSymbols } from 'sota-common';
import { getConnection, In } from 'typeorm';
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

  await getConnection()
    .getRepository(LatestBlock)
    .update({ currency: In(tokens), type }, { blockNumber });
}

export { onBlockCrawled };
