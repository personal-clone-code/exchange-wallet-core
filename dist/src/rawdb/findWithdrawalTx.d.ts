import { WithdrawalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
export declare function findOneWithdrawalTx(manager: EntityManager, currencies: string | string[], statuses: WithdrawalStatus | WithdrawalStatus[]): Promise<WithdrawalTx>;
export declare function findOneWithdrawalTxWithId(manager: EntityManager, currencies: string | string[], statuses: WithdrawalStatus | WithdrawalStatus[], withdrawalId: number): Promise<WithdrawalTx>;
