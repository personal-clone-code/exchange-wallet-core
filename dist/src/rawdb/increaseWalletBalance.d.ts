import { EntityManager } from 'typeorm';
import { BigNumber } from 'sota-common';
export declare function increaseWalletBalance(manager: EntityManager, walletId: number, symbol: string, amount: BigNumber): Promise<void>;
export default increaseWalletBalance;
