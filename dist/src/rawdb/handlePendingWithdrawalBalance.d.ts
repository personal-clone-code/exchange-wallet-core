import { EntityManager } from 'typeorm';
import { ICurrency } from 'sota-common';
export declare function handlePendingWithdrawalBalance(manager: EntityManager, amount: string, walletId: number, iCurrency: ICurrency): Promise<void>;
