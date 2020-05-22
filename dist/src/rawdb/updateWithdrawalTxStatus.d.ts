import { ISubmittedTransaction, BigNumber } from 'sota-common';
import { WithdrawalTx } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
export declare function updateWithdrawalTxStatus(manager: EntityManager, id: number, status: WithdrawalStatus, transactionResult?: ISubmittedTransaction, fee?: BigNumber): Promise<WithdrawalTx>;
