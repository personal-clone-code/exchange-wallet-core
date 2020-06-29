import { EntityManager } from 'typeorm';
export declare function hasPendingWithdrawal(manager: EntityManager, currency: string): Promise<boolean>;
