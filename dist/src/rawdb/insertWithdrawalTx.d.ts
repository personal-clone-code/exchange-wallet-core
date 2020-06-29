import { EntityManager } from 'typeorm';
import { WithdrawalTx } from '../entities';
export declare function insertWithdrawalTx(manager: EntityManager, withdrawalTx: WithdrawalTx): Promise<WithdrawalTx>;
export default insertWithdrawalTx;
