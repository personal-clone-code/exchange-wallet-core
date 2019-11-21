import { UserCurrency } from '../entities';
import { EntityManager } from 'typeorm';

export async function getUserCurrency(userId: number, currency: string, manager: EntityManager) {
  return await manager.findOne(UserCurrency, {
    userId,
    systemSymbol: currency,
  });
}
