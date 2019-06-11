import { EntityManager } from 'typeorm';
import { WalletBalance } from '../entities';
import { Utils, BigNumber, CurrencyRegistry } from 'sota-common';

/**
 * Increase wallet balance due to incoming deposit
 *
 */
export async function increaseWalletBalance(
  manager: EntityManager,
  walletId: number,
  symbol: string,
  amount: BigNumber
): Promise<void> {
  const currency = CurrencyRegistry.getOneCurrency(symbol);
  await manager
    .createQueryBuilder()
    .update(WalletBalance)
    .set({
      balance: () => `balance + ${amount.toFixed(currency.nativeScale)}`,
      updatedAt: Utils.nowInMillis(),
    })
    .where({ currency: symbol, walletId })
    .execute();

  return;
}

export default increaseWalletBalance;
