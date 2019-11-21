import { LocalTx } from '../entities';
import { EntityManager, In } from 'typeorm';
import { LocalTxStatus } from '../Enums';

export async function findOneLocalTx(
  manager: EntityManager,
  currencies: string | string[],
  statuses: LocalTxStatus | LocalTxStatus[]
): Promise<LocalTx> {
  // Find wallet of record
  return await manager.findOne(LocalTx, {
    order: { updatedAt: 'ASC' },
    where: {
      currency: Array.isArray(currencies) ? In(currencies) : currencies,
      status: Array.isArray(statuses) ? In(statuses) : statuses,
    },
  });
}

export async function findOneLocalTxWithId(
  manager: EntityManager,
  currencies: string | string[],
  statuses: LocalTxStatus | LocalTxStatus[],
  withdrawalId: number
): Promise<LocalTx> {
  // Find wallet of record
  return await manager.findOne(LocalTx, {
    order: { updatedAt: 'ASC' },
    where: {
      currency: Array.isArray(currencies) ? In(currencies) : currencies,
      status: Array.isArray(statuses) ? In(statuses) : statuses,
      id: withdrawalId,
    },
  });
}
