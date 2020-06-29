import { ISubmittedTransaction } from 'sota-common';
import { Withdrawal } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalEvent, WithdrawalStatus } from '../Enums';
export declare function updateWithdrawalsStatus(manager: EntityManager, withdrawalTxId: number, status: WithdrawalStatus, event: WithdrawalEvent, transactionResult?: ISubmittedTransaction, data?: string): Promise<Withdrawal[]>;
