import { EntityManager } from 'typeorm';
import { WithdrawalEvent } from '../Enums';
export declare function insertWithdrawalLog(manager: EntityManager, txid: string, refId: number, event: WithdrawalEvent, data?: string): Promise<void>;
export default insertWithdrawalLog;
