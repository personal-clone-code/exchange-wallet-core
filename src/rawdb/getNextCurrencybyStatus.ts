import { EntityManager, In } from 'typeorm';
import _ from 'lodash';
import { WithdrawalTx } from '../entities';
import { WithdrawalStatus } from '../Enums';

export async function getNextCurrencyByStatus(
  manager: EntityManager,
  currencies: string[],
  statuses: WithdrawalStatus[]
): Promise<string> {
  const withdrawalTx = await manager.findOne(WithdrawalTx, {
    currency: In(currencies),
    status: In(statuses),
  });

  if (!withdrawalTx) {
    return null;
  }

  return withdrawalTx.currency;
}
