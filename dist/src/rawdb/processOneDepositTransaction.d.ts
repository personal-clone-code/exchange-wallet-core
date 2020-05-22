import { EntityManager } from 'typeorm';
import { BaseCrawler, Transaction } from 'sota-common';
export declare function processOneDepositTransaction(manager: EntityManager, crawler: BaseCrawler, tx: Transaction, watchingAddresses: string[]): Promise<void>;
export declare function updateAddressBalance(manager: EntityManager, tx: Transaction): Promise<void>;
export default processOneDepositTransaction;
