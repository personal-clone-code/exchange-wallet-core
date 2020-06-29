import { BaseCrawler, Transaction } from 'sota-common';
export default function onTxCrawled(crawler: BaseCrawler, tx: Transaction): Promise<void>;
export { onTxCrawled };
