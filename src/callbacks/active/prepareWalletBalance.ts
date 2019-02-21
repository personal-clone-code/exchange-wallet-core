import { Wallet, WalletBalance } from '../../entities';
import { getConnection } from 'typeorm';
import { Currency } from 'sota-common';

export async function prepareWalletBalance(currency: Currency, symbol: string): Promise<void> {
  const connection = getConnection();

  const [wallets] = await Promise.all([connection.getRepository(Wallet).find({ currency })]);

  const values: any = wallets.map(wallet => ({
    walletId: wallet.id,
    coin: symbol,
  }));

  await connection
    .createQueryBuilder()
    .insert()
    .into(WalletBalance)
    .values(values)
    .orIgnore()
    .execute();

  return;
}

export async function prepareWalletBalanceAll(currency: Currency, symbols: string[]): Promise<void> {
  const connection = getConnection();

  const [wallets] = await Promise.all([connection.getRepository(Wallet).find({ currency })]);

  const values: any = wallets.map(wallet => {
    return symbols.map(symbol => ({
      walletId: wallet.id,
      coin: symbol,
    }));
  });

  await connection
    .createQueryBuilder()
    .insert()
    .into(WalletBalance)
    .values(values)
    .orIgnore()
    .execute();

  return;
}
