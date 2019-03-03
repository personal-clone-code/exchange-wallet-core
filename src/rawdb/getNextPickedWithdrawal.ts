import { EntityManager, In } from 'typeorm';
import _ from 'lodash';
import { Withdrawal } from '../entities';
import { WithdrawalStatus } from '../Enums';

/**
 * Determine which withdrawal record will be picked in this round
 *
 * @param manager
 * @param currencies
 */
export async function getNextPickedWithdrawal(manager: EntityManager, currencies: string[]): Promise<Withdrawal> {
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  const pending = await manager
    .getRepository(Withdrawal)
    .createQueryBuilder()
    .where('currency', In(currencies))
    .andWhere('status', In(pendingStatuses))
    .select('DISTINCT currency')
    .getMany();

  const pendingCurrencies = pending.map(p => p.currency);
  const notPendingCurrencies = _.difference(currencies, pendingCurrencies);

  if (notPendingCurrencies.length === 0) {
    return null;
  }

  const result = await manager.getRepository(Withdrawal).findOne({
    currency: In(notPendingCurrencies),
    status: WithdrawalStatus.UNSIGNED,
  });

  return result;
}
