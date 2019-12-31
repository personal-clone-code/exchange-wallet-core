import { getLogger, BigNumber } from 'sota-common';
import { Withdrawal } from '../entities';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus } from '../Enums';

const logger = getLogger('rawdb::findSentWithdrawal');

export async function findWithdrawalsByStatus(
  manager: EntityManager,
  walletId: number,
  currency: string,
  status: string,
  limit: number
): Promise<Withdrawal[]> {
  // Find wallet of record
  return manager.getRepository(Withdrawal).find({
    order: {
      updatedAt: 'ASC',
    },
    take: limit,
    where: { walletId, currency, status },
  });
}

export async function findWithdrawalsPendingBalance(
  manager: EntityManager,
  walletId: number,
  userId: number,
  currency: string,
  address: string
): Promise<BigNumber> {
  const result = await manager
    .getRepository(Withdrawal)
    .createQueryBuilder('withdrawal')
    .select('SUM(amount)', 'pending')
    .where('status NOT IN (:...statuses)', {
      statuses: [WithdrawalStatus.COMPLETED, WithdrawalStatus.FAILED],
    })
    .andWhere('wallet_id = :id', { id: walletId })
    .andWhere('currency = :currency', { currency })
    .andWhere('from_address = :address', { address })
    .getRawOne();

  if (!result || !result.pending) {
    return new BigNumber(0);
  }
  return new BigNumber(result.pending);
}

export default findWithdrawalsByStatus;
