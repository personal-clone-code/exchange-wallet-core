import { ISubmittedTransaction, BigNumber, BlockHeader } from 'sota-common';
import { LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { LocalTxStatus } from '../Enums';
export declare function updateLocalTxStatus(manager: EntityManager, id: number, status: LocalTxStatus, transactionResult?: ISubmittedTransaction, fee?: BigNumber, blockHeader?: BlockHeader): Promise<LocalTx>;
