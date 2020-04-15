import { EntityManager } from 'typeorm';
import { Address } from '../entities';

export async function isExternalAddress(manager: EntityManager, address: string): Promise<boolean> {
  const record = await manager.getRepository(Address).findOne({
    where: {
      address,
    },
  });
  return !record;
}
