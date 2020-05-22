import { LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { CollectStatus, DepositEvent } from '../Enums';
export declare function updateDepositCollectStatusBySeedTxId(manager: EntityManager, transaction: LocalTx, status: CollectStatus, event: DepositEvent): Promise<void>;
export declare function updateDepositCollectStatusByCollectTxId(manager: EntityManager, transaction: LocalTx, status: CollectStatus, event: DepositEvent): Promise<void>;
export declare function updateDepositCollectStatusByWithdrawalTxId(manager: EntityManager, transaction: LocalTx, withdrawal_id: number, status: CollectStatus, event: DepositEvent): Promise<void>;
