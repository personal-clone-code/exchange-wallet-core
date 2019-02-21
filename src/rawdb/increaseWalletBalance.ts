import { EntityManager } from 'typeorm';
import { WalletBalance } from '../entities';
import { Utils } from 'sota-common';

/**
 * Increase wallet balance due to incoming deposit
 *
 */
export async function increaseWalletBalance(
  manager: EntityManager,
  walletId: number,
  coin: string,
  amount: string
): Promise<void> {
  await manager
    .createQueryBuilder()
    .update(WalletBalance)
    .set({ balance: () => `balance + ${amount}`, updatedAt: Utils.nowInMillis() })
    .where({ coin, walletId })
    .execute();

  return;
}

export default increaseWalletBalance;
