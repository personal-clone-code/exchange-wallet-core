import { WithdrawalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
export declare function findWithdrawalTxByStatus(manager: EntityManager, currency: string, status: WithdrawalStatus[]): Promise<WithdrawalTx>;
