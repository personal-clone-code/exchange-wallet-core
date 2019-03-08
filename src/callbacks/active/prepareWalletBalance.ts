import { Wallet, WalletBalance } from '../../entities';
import { getConnection } from 'typeorm';
import { Currency, Utils } from 'sota-common';

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

  const values: any[] = [];

  wallets.map(wallet => {
    values.push(
      ...symbols.map(symbol => ({
        walletId: wallet.id,
        coin: symbol,
        balance: 0,
        withdrawalPending: 0,
        withdrawalTotal: 0,
        depositTotal: 0,
        createdAt: Utils.nowInSeconds(),
        updatedAt: Utils.nowInSeconds(),
      }))
    );
  });

  await connection
    .createQueryBuilder()
    .insert()
    .into(WalletBalance)
    .values(values)
    .execute();

  return;
}
