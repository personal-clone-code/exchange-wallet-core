import { EntityManager } from 'typeorm';
import { Utils, BlockchainPlatform, CurrencyRegistry, getLogger, BigNumber } from 'sota-common';
import { WalletLog, WalletBalance, Address, Wallet, Deposit } from '../entities';
import { WalletEvent } from '../Enums';
import * as rawdb from '.';

const logger = getLogger('rawdb::insertDeposit');

export async function updateWalletBalanceAfterDeposit(
  manager: EntityManager,
  depositId: number,
  amount: BigNumber
): Promise<void> {
  const deposit = await manager.getRepository(Deposit).findOneOrFail({ id: depositId });
  const address = await manager.getRepository(Address).findOneOrFail({ address: deposit.toAddress });
  if (address.isExternal) {
    logger.info(`External Address ${address.address} do not need to update walletBalance`);
    return;
  }
  const wallet = await manager.getRepository(Wallet).findOneOrFail(address.walletId);

  const currency = deposit.currency;
  const currencyInfo = CurrencyRegistry.getOneCurrency(currency);

  const walletBalance = await manager.getRepository(WalletBalance).findOne({ walletId: wallet.id, currency });
  if (!walletBalance) {
    throw new Error(`Wallet balance doesn't exist: walletId=${wallet.id} currency=${currency}`);
  }

  const walletLog = new WalletLog();
  walletLog.walletId = wallet.id;
  walletLog.currency = currency;
  walletLog.refCurrency = currency;
  walletLog.event = WalletEvent.DEPOSIT;
  walletLog.balanceChange = amount.toFixed(currencyInfo.nativeScale);
  walletLog.refId = deposit.id;

  await Utils.PromiseAll([
    rawdb.increaseWalletBalance(manager, wallet.id, currency, amount),
    rawdb.insertWalletLog(manager, walletLog),
  ]);

  if (currency === BlockchainPlatform.Cardano) {
    const hotWallet = await rawdb.findAnyHotWallet(manager, wallet.id, currencyInfo.platform, false);
    await rawdb.upperThresholdHandle(manager, currencyInfo, hotWallet);
  } else {
    const hotWallet = await rawdb.findHotWalletByAddress(manager, deposit.toAddress);
    if (hotWallet) {
      await rawdb.upperThresholdHandle(manager, currencyInfo, hotWallet);
    }
  }
}
