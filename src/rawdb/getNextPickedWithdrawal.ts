import { EntityManager, In } from 'typeorm';
import _ from 'lodash';
import { Withdrawal } from '../entities';
import { WithdrawalStatus } from '../Enums';
import findWithdrawalsByStatus from './findWithdrawalsByStatus';

/**
 * Determine which withdrawal record will be picked in this round
 *
 * @param manager
 * @param currencies
 */
export async function getNextPickedWithdrawals(
  manager: EntityManager,
  currencies: string[],
  limit: number
): Promise<Withdrawal[]> {
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
    return [];
  }

  const firstRecord = await manager.getRepository(Withdrawal).findOne({
    currency: In(notPendingCurrencies),
    status: WithdrawalStatus.UNSIGNED,
  });

  if (!firstRecord) {
    return [];
  }

  const records = await findWithdrawalsByStatus(
    manager,
    firstRecord.walletId,
    firstRecord.currency,
    WithdrawalStatus.UNSIGNED,
    limit
  );

  return records;
}
