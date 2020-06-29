import { EntityManager } from 'typeorm';
import { Deposit } from '../entities';
export declare function insertWithdrawals(manager: EntityManager, records: Deposit[], toAddress: string, userId: number): Promise<Map<number, number>>;
