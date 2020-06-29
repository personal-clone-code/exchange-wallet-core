import { BaseCrawler, Transactions } from 'sota-common';
export default function onCrawlingTxs(crawler: BaseCrawler, allTxs: Transactions): Promise<void>;
export { onCrawlingTxs };
