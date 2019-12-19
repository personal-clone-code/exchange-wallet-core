import { UserCurrency } from '../entities';
import { EntityManager } from 'typeorm';

export async function getUserCurrency(manager: EntityManager, userId: number, currency: string) {
  return await manager.findOne(UserCurrency, {
    userId,
    systemSymbol: currency,
  });
}
