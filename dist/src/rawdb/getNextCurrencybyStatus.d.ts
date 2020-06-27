import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
export declare function getNextCurrencyByStatus(manager: EntityManager, currencies: string[], statuses: WithdrawalStatus[]): Promise<string>;
