import { UserCurrency } from '../entities';
import { EntityManager } from 'typeorm';
export declare function getUserCurrency(manager: EntityManager, userId: number, currency: string): Promise<UserCurrency>;
