import { EntityManager } from 'typeorm';
import { Deposit } from '../entities';
import { CollectStatus } from '../Enums';
import { ICurrency, BigNumber } from 'sota-common';
export declare function findOneGroupOfCollectableDeposits(manager: EntityManager, currencies: string[]): Promise<{
    walletId: number;
    currency: ICurrency;
    records: Deposit[];
    amount: BigNumber;
}>;
export declare function findOneGroupOfDepositsNeedSeedingFee(manager: EntityManager, currencies: string[]): Promise<{
    walletId: number;
    currency: ICurrency;
    records: Deposit[];
}>;
export declare function findOneGroupOfDeposits(manager: EntityManager, currencies: string[], collectStatuses: CollectStatus[]): Promise<{
    walletId: number;
    currency: ICurrency;
    records: Deposit[];
}>;
export declare function findDepositsInCollectingTx(manager: EntityManager, localTxId: number): Promise<Deposit[]>;
