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
import { WithdrawalStatus } from '../Enums';
import { WithdrawalTx, WalletBalance, Withdrawal, HotWallet, Wallet } from '../entities';
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

  if (balance.lt(upper)) {
    logger.info(
      `Hot wallet symbol=${iCurrency.symbol} address=${hotWallet.address} is not in upper threshold, ignore collecting`
    );
    return;
  }

  const withdrawal = new Withdrawal();
  const amount = balance.minus(middle).toFixed(currency.nativeScale);
  withdrawal.currency = iCurrency.symbol;
  withdrawal.fromAddress = hotWallet.address;
  withdrawal.note = 'from machine';
  withdrawal.amount = amount;
  withdrawal.userId = 0;
  withdrawal.walletId = hotWallet.walletId;
  withdrawal.toAddress = coldWallet.address;
  withdrawal.status = WithdrawalStatus.UNSIGNED;
  // Create withdrawal tx record
  await manager.save(withdrawal);
  await manager
    .createQueryBuilder()
    .update(WalletBalance)
    .set({
      balance: () => {
        return `balance - ${amount}`;
      },
      withdrawalPending: () => {
        return `withdrawal_pending + ${amount}`;
      },
      updatedAt: Utils.nowInMillis(),
    })
    .where({
      walletId: hotWallet.walletId,
      currency: iCurrency.symbol,
    })
    .execute(),
    logger.info(
      `Withdrawal created from hot wallet address=${hotWallet.address} to cold wallet address=${
        coldWallet.address
      } amount=${amount} symbol=${iCurrency.symbol}`
    );
}

export async function lowerThresholdHandle(manager: EntityManager, sentRecord: WithdrawalTx) {
  // do not throw Error in this function, this logic is optional
  const hotWallet = await rawdb.findHotWalletByAddress(manager, sentRecord.hotWalletAddress);
  if (!hotWallet) {
    logger.error(`hotWallet address=${sentRecord.hotWalletAddress} not found`);
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

  if (balance.gt(lower)) {
    logger.info(
      `Hot wallet symbol=${sentRecord.currency} address=${
        hotWallet.address
      } is not in lower threshold, ignore notifying`
    );
    return;
  }

  // TBD: this code from Logger.ts, should move to Util or somewhere better
  logger.info(`Hot wallet balance is in lower threshold address=${hotWallet.address}`);
  const mailerAccount = EnvConfigRegistry.getCustomEnvConfig('MAILER_ACCOUNT');
  const mailerPassword = EnvConfigRegistry.getCustomEnvConfig('MAILER_PASSWORD');
  const mailerReceiver = EnvConfigRegistry.getCustomEnvConfig('MAILER_RECEIVER');

  if (!mailerAccount || !mailerPassword || !mailerReceiver) {
    logger.error(
      `Revise this: MAILER_ACCOUNT=${mailerAccount}, MAILER_PASSWORD=${mailerPassword}, MAILER_RECEIVER=${mailerReceiver}`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailerAccount,
      pass: mailerPassword,
    },
  });

  const mailOptions = {
    from: mailerAccount,
    to: mailerReceiver,
    subject: `Hot wallet ${hotWallet.address} is near lower threshold`,
    html: `lower_threshold=${lower}, current_balance=${balance}, address=${hotWallet.address}, currency=${
      sentRecord.currency
    }`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Message sent: ${info.messageId}`);
    logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    logger.error('Cannot send email, ignore notifying');
    logger.error(err);
  }
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
