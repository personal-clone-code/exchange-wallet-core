import { BaseCrawler, Block } from 'sota-common';
export default function onBlockCrawled(crawler: BaseCrawler, block: Block): Promise<void>;
export { onBlockCrawled };
