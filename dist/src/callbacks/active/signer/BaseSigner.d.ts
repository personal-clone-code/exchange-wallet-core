import { ICurrency, BaseGateway, ISignedRawTransaction } from 'sota-common';
import { LocalTx } from '../../../entities';
import { EntityManager } from 'typeorm';
export declare abstract class BaseSigner {
    protected localTx: LocalTx;
    protected currency: ICurrency;
    protected gateway: BaseGateway;
    protected manager: EntityManager;
    protected signedTx: ISignedRawTransaction;
    constructor(localTx: LocalTx);
    proceed(manager: EntityManager, failedCounter: number): Promise<number>;
    protected abstract prepare(): Promise<void>;
    protected abstract isBusy(): Promise<boolean>;
    protected abstract signTx(): Promise<void>;
    protected saveSignedTx(): Promise<void>;
    protected abstract updateRelatedTables(): Promise<void>;
}
