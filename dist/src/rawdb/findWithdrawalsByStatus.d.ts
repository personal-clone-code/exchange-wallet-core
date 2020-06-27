import { BigNumber } from 'sota-common';
import { Withdrawal } from '../entities';
import { EntityManager } from 'typeorm';
export declare function findWithdrawalsByStatus(manager: EntityManager, walletId: number, currency: string, status: string, limit: number): Promise<Withdrawal[]>;
export declare function findWithdrawalsPendingBalance(manager: EntityManager, walletId: number, userId: number, currency: string, address: string): Promise<BigNumber>;
export default findWithdrawalsByStatus;
