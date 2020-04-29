import { EntityManager } from 'typeorm';
import { BigNumber } from 'sota-common';
import { LocalTx } from '../entities';
export declare function updateWalletBalanceAfterCollecting(manager: EntityManager, localTx: LocalTx, amount: BigNumber): Promise<void>;
