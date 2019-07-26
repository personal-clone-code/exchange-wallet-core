import {
  Utils,
  CurrencyRegistry,
  getLogger,
  GatewayRegistry,
  BigNumber,
  IRawTransaction,
  UTXOBasedGateway,
  AccountBasedGateway,
  ICurrency,
} from 'sota-common';
import * as rawdb from '../rawdb';
import { EntityManager, getConnection, In } from 'typeorm';
import { WithdrawalStatus, WithdrawalEvent, InternalTransferType, CollectStatus, DepositEvent } from '../Enums';
import { WithdrawalTx, InternalTransfer, DepositLog, Deposit, WalletBalance, Withdrawal, HotWallet } from '../entities';
const logger = getLogger('upperThresholdHandle');

export async function upperThresholdHandle(
  manager: EntityManager,
  iCurrency: ICurrency,
  hotWallet: HotWallet
): Promise<void> {
  //  do not throw Error in this function, this logic is optional
  const walletBalance = await manager.findOne(WalletBalance, {
    walletId: hotWallet.walletId,
    currency: iCurrency.symbol,
  });
  if (!walletBalance) {
    logger.error(`Wallet id=${hotWallet.walletId} is not found`);
    return;
  }
  const currencyConfig = await rawdb.findOneCurrency(manager, iCurrency.symbol, hotWallet.walletId);
  if (!currencyConfig) {
    logger.error(`Currency threshold symbol=${iCurrency.symbol} is not found`);
    return;
  }

  const sameWallet = await rawdb.findColdWalletByAddress(manager, hotWallet.address);
  if (sameWallet) {
    logger.info(
      `Hot wallet symbol=${iCurrency.symbol} address=${
        hotWallet.address
      } is registered as a cold wallet. Ignore collecting`
    );
    return;
  }

  // platform cold wallet
  const coldWallet = await rawdb.findAnyColdWallet(manager, hotWallet.walletId, hotWallet.currency);
  if (!coldWallet) {
    logger.warn(`Cold wallet symbol=${hotWallet.currency} is not found, ignore forwarding`);
    return;
  }

  const upper = new BigNumber(currencyConfig.upperThreshold);
  const lower = new BigNumber(currencyConfig.lowerThreshold);
  let middle;
  if (!currencyConfig.middleThreshold) {
    middle = upper.plus(lower).div(new BigNumber(2));
  } else {
    middle = new BigNumber(currencyConfig.middleThreshold);
  }

  const gateway = GatewayRegistry.getGatewayInstance(iCurrency.symbol);
  const currency = CurrencyRegistry.getOneCurrency(iCurrency.symbol);
  let balance = await gateway.getAddressBalance(hotWallet.address);

  const pending = await rawdb.findWithdrawalsPendingBalance(
    manager,
    hotWallet.walletId,
    hotWallet.userId,
    iCurrency.symbol,
    hotWallet.address
  );
  balance = balance.minus(pending);

  if (balance.lt(upper)) {
    logger.info(
      `Hot wallet symbol=${iCurrency.symbol} address=${hotWallet.address} is not in upper threshold, ignore collecting`
    );
    return;
  }

  const withdrawal = new Withdrawal();
  const amount = balance.minus(middle);
  withdrawal.currency = iCurrency.symbol;
  withdrawal.fromAddress = hotWallet.address;
  withdrawal.note = 'from machine';
  withdrawal.amount = amount.toString();
  withdrawal.userId = 0;
  withdrawal.walletId = hotWallet.walletId;
  withdrawal.toAddress = coldWallet.address;
  withdrawal.status = WithdrawalStatus.UNSIGNED;

  let unsignedTx: IRawTransaction = null;
  try {
    if (currency.isUTXOBased) {
      unsignedTx = await (gateway as UTXOBasedGateway).constructRawTransaction(hotWallet.address, [
        {
          toAddress: withdrawal.toAddress,
          amount,
        },
      ]);
    } else {
      unsignedTx = await (gateway as AccountBasedGateway).constructRawTransaction(
        withdrawal.fromAddress,
        withdrawal.toAddress,
        amount
      );
    }
  } catch (err) {
    // Most likely the fail reason is insufficient balance from hot wallet
    // Or there was problem with connection to the full node
    logger.error(
      `Could not create raw tx address=${withdrawal.fromAddress}, to=${withdrawal.toAddress}, amount=${amount}`
    );
    return;
  }

  if (!unsignedTx) {
    logger.error(`Could not construct unsigned tx. Just wait until the next tick...`);
    return;
  }

  // Create withdrawal tx record
  await manager.save(withdrawal);
  await Utils.PromiseAll([
    rawdb.doPickingWithdrawals(manager, unsignedTx, hotWallet, currency.symbol, [withdrawal.id]),
    manager
      .createQueryBuilder()
      .update(WalletBalance)
      .set({
        balance: () => {
          return `balance - ${amount.toFixed(currency.nativeScale)}`;
        },
        withdrawalPending: () => {
          return `withdrawal_pending + ${amount.toFixed(currency.nativeScale)}`;
        },
        updatedAt: Utils.nowInMillis(),
      })
      .where({
        walletId: hotWallet.walletId,
        currency: iCurrency.symbol,
      })
      .execute(),
  ]);

  logger.info(
    `Withdrawal created from hot wallet address=${hotWallet.address} to cold wallet address=${
      coldWallet.address
    } amount=${amount} symbol=${iCurrency.symbol}`
  );
}
