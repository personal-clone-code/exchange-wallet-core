import { ISubmittedTransaction } from 'sota-common';
import { EntityManager } from 'typeorm';
import { LocalTx } from '../entities';
export declare function reconstructLocalTx(manager: EntityManager, localTx: LocalTx, txResult?: ISubmittedTransaction): Promise<void>;
