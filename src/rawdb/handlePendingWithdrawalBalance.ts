import { EntityManager } from 'typeorm';
import { WalletBalance } from '../entities';
import { ICurrency, Utils } from 'sota-common';

export async function handlePendingWithdrawalBalance(
  manager: EntityManager,
  amount: string,
  walletId: number,
  iCurrency: ICurrency
) {
  await manager
    .createQueryBuilder()
    .update(WalletBalance)
    .set({
      withdrawalPending: () => {
        return `withdrawal_pending + ${amount}`;
      },
      updatedAt: Utils.nowInMillis(),
    })
    .where({
      walletId,
      currency: iCurrency.symbol,
    })
    .execute();
}
