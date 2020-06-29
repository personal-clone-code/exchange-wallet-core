import { LocalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { LocalTxStatus } from '../Enums';
export declare function findOneLocalTx(manager: EntityManager, currencies: string | string[], statuses: LocalTxStatus | LocalTxStatus[]): Promise<LocalTx>;
export declare function findOneLocalTxWithId(manager: EntityManager, currencies: string | string[], statuses: LocalTxStatus | LocalTxStatus[], withdrawalId: number): Promise<LocalTx>;
