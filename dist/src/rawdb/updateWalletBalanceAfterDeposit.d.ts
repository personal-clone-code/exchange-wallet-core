import { EntityManager } from 'typeorm';
import { BigNumber } from 'sota-common';
export declare function updateWalletBalanceAfterDeposit(manager: EntityManager, depositId: number, amount: BigNumber): Promise<void>;
