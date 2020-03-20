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
  EnvConfigRegistry,
  BlockchainPlatform,
} from 'sota-common';
import * as rawdb from '.';
import { EntityManager } from 'typeorm';
import { WithdrawalStatus, WithdrawOutType } from '../Enums';
import { WithdrawalTx, WalletBalance, Withdrawal, HotWallet, Wallet, LocalTx, Address } from '../entities';
import { getWithdrawalMode } from './findHotWallets';
const nodemailer = require('nodemailer');
const logger = getLogger('ThresholdHandle');

export async function checkUpperThreshold(manager: EntityManager, platform: BlockchainPlatform) {
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platform);
  const wallets = await manager.getRepository(Wallet).find({
    where: {
      currency: platform,
    },
  });
  await Promise.all(
    wallets.map(async wallet => {
      const hotWallets = await rawdb.findFreeHotWallets(manager, wallet.id, platform);
      await Promise.all(
        allCurrencies.map(
          async _currency =>
            await Promise.all(hotWallets.map(_hotWallet => rawdb.upperThresholdHandle(manager, _currency, _hotWallet)))
        )
      );
    })
  );
}

export async function upperThresholdHandle(
  manager: EntityManager,
  iCurrency: ICurrency,
  hotWallet: HotWallet
): Promise<void> {
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  if (await rawdb.checkHotWalletIsBusy(manager, hotWallet, pendingStatuses, iCurrency.platform)) {
    logger.info(`Hot wallet address=${hotWallet.address} is busy, ignore collecting`);
    return;
  }
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

  if (upper.eq(0) || balance.lt(upper)) {
    logger.info(
      `Hot wallet symbol=${iCurrency.symbol} address=${hotWallet.address} is not in upper threshold, ignore collecting`
    );
    return;
  }

  const withdrawal = new Withdrawal();
  const amount = balance.minus(middle).toFixed(currency.nativeScale);
  withdrawal.currency = iCurrency.symbol;
  withdrawal.fromAddress = hotWallet.address;
  withdrawal.memo = 'FROM_MACHINE';
  withdrawal.amount = amount;
  withdrawal.userId = hotWallet.userId;
  withdrawal.type = (await getWithdrawalMode(manager, hotWallet.walletId)) + WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX;
  withdrawal.walletId = hotWallet.walletId;
  withdrawal.toAddress = coldWallet.address;
  withdrawal.status = WithdrawalStatus.UNSIGNED;

  // Create withdrawal tx record
  await manager.save(withdrawal);
  return;
}

export async function lowerThresholdHandle(manager: EntityManager, sentRecord: LocalTx) {
  // do not throw Error in this function, this logic is optional
  const hotWallet = await rawdb.findHotWalletByAddress(manager, sentRecord.fromAddress);
  if (!hotWallet) {
    logger.error(`hotWallet address=${sentRecord.fromAddress} not found`);
    return;
  }
  const currencyConfig = await rawdb.findOneCurrency(manager, sentRecord.currency, sentRecord.walletId);
  if (!currencyConfig || !currencyConfig.lowerThreshold) {
    logger.error(`Currency threshold symbol=${sentRecord.currency} is not found or lower threshold is not setted`);
    return;
  }

  const lower = new BigNumber(currencyConfig.lowerThreshold);
  const gateway = GatewayRegistry.getGatewayInstance(sentRecord.currency);
  let balance = await gateway.getAddressBalance(hotWallet.address);

  const pending = await rawdb.findWithdrawalsPendingBalance(
    manager,
    hotWallet.walletId,
    hotWallet.userId,
    sentRecord.currency,
    hotWallet.address
  );
  balance = balance.minus(pending);

  if (lower.eq(0) || balance.gt(lower)) {
    logger.info(
      `Hot wallet symbol=${sentRecord.currency} address=${
        hotWallet.address
      } is not in lower threshold, ignore notifying`
    );
    return;
  }

  // TBD: this code from Logger.ts, should move to Util or somewhere better
  logger.info(`Hot wallet balance is in lower threshold address=${hotWallet.address}`);
  const appName: string = process.env.APP_NAME || 'Exchange Wallet';
  const sender = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_ADDRESS');
  const senderName = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_NAME');
  const receiver = EnvConfigRegistry.getCustomEnvConfig('MAIL_RECIPIENT_COLD_WALLET');
  if (!receiver || !Utils.isValidEmail(receiver)) {
    logger.error(`Mailer could not send email to receiver=${receiver}. Please check it.`);
    return;
  }
  await rawdb.insertMailJob(manager, {
    senderAddress: sender,
    senderName,
    recipientAddress: receiver,
    title: `[${appName}] Hot wallet ${hotWallet.address} is near lower threshold`,
    templateName: 'hot_wallet_balance_lower_threshold_layout.hbs',
    content: {
      lower_threshold: lower,
      current_balance: balance,
      address: hotWallet.address,
      currency: sentRecord.currency,
    },
  });
}

export async function checkHotWalletIsSufficient(hotWallet: HotWallet, amount: BigNumber) {
  const gateway = GatewayRegistry.getGatewayInstance(hotWallet.currency);
  const hotWalletBalance = await gateway.getAddressBalance(hotWallet.address);
  logger.debug(`checkHotWalletIsSufficient: wallet=${hotWallet.address} amount=${amount} balance=${hotWalletBalance}`);
  if (hotWalletBalance.gte(amount)) {
    return true;
  }
  return false;
}

export async function checkAddressIsSufficient(address: Address, amount: BigNumber): Promise<boolean> {
  const gateway = GatewayRegistry.getGatewayInstance(address.currency);
  const hotWalletBalance = await gateway.getAddressBalance(address.address);
  logger.debug(`checkAddressSufficient: wallet=${address.address} amount=${amount} balance=${hotWalletBalance}`);
  if (hotWalletBalance.gte(amount)) {
    return true;
  }
  return false;
}
