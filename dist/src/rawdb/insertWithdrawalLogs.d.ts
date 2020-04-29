import { EntityManager } from 'typeorm';
import { WithdrawalEvent } from '../Enums';
export declare function insertWithdrawalLogs(manager: EntityManager, withdrawalIds: number[], event: WithdrawalEvent, refId: number, data: string): Promise<void>;
export default insertWithdrawalLogs;
