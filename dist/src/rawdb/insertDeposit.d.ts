import { EntityManager } from 'typeorm';
import { TransferEntry } from 'sota-common';
export declare function insertDeposit(manager: EntityManager, output: TransferEntry, senderAddresses: string[]): Promise<void>;
export default insertDeposit;
