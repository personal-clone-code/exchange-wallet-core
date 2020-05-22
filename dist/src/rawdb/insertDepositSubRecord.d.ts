import { EntityManager } from 'typeorm';
import { TransferEntry } from 'sota-common';
export declare function insertDepositSubRecord(manager: EntityManager, depositId: number, output: TransferEntry): Promise<void>;
