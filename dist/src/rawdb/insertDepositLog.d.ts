import { EntityManager } from 'typeorm';
import { DepositEvent } from '../Enums';
export declare function insertDepositLog(manager: EntityManager, depositId: number, event: DepositEvent, refId?: number, userId?: number): Promise<void>;
