import {
  TransactionStatus,
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  GatewayRegistry,
  BigNumber,
  IRawTransaction,
  UTXOBasedGateway,
  AccountBasedGateway,
  EnvConfigRegistry,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection, In } from 'typeorm';
import { WithdrawalStatus, WithdrawalEvent, InternalTransferType, CollectStatus, DepositEvent } from '../../Enums';
import {
  WithdrawalTx,
  InternalTransfer,
  DepositLog,
  Deposit,
  WalletBalance,
  Withdrawal,
  HotWallet,
} from '../../entities';

const logger = getLogger('verifierDoProcess');
const nodemailer = require('nodemailer');

export async function verifierDoProcess(verfifier: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _verifierDoProcess(manager, verfifier);
  });
}

/**
 * Tasks of verifier:
 * - Find one withdrawal_tx or internal_transfer record that has `status` = `sent`
 * - Check whether the txid is confirmed on the blockchain network
 * - Update the status of corresponding withdrawal and withdrawal_tx or internal_transfer records
 *
 * @param manager
 * @param verifier
 */
async function _verifierDoProcess(manager: EntityManager, verifier: BasePlatformWorker): Promise<void> {
  const platformCurrency = verifier.getCurrency();
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = allCurrencies.map(c => c.symbol);
  const sentRecord = await rawdb.findOneWithdrawalTx(manager, allSymbols, [WithdrawalStatus.SENT]);

  if (sentRecord) {
    logger.info(`Found withdrawal tx need vefifying: txid=${sentRecord.txid}`);
    return verifierWithdrawalDoProcess(manager, sentRecord);
  }

  logger.info(`There are not sent withdrawals to be verified: platform=${platformCurrency.platform}`);
  logger.info(`Find internal transfer: platform=${platformCurrency.platform}`);
  const internalRecord = await rawdb.findOneInternalTransferByCollectStatus(manager, allSymbols, [
    WithdrawalStatus.SENT,
  ]);

  if (!internalRecord) {
    logger.info(`There are not sent internal txs to be verified: platform=${platformCurrency.platform}`);
    return;
  }

  logger.info(`Found internal tx need vefifying: txid=${internalRecord.txid}`);
  return verifierInternalDoProcess(manager, internalRecord);
}

async function verifierWithdrawalDoProcess(manager: EntityManager, sentRecord: WithdrawalTx): Promise<void> {
  const currency = CurrencyRegistry.getOneCurrency(sentRecord.currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  let event = WithdrawalEvent.COMPLETED;
  let verifiedStatus = WithdrawalStatus.COMPLETED;

  // Verify withdrawal information from blockchain network
  const transactionStatus = await gateway.getTransactionStatus(sentRecord.txid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${sentRecord.txid}`);
    await rawdb.updateRecordsTimestamp(manager, WithdrawalTx, [sentRecord.id]);
    return;
  }

  if (transactionStatus === TransactionStatus.FAILED) {
    event = WithdrawalEvent.FAILED;
    verifiedStatus = WithdrawalStatus.FAILED;
  }
  logger.info(`Transaction ${sentRecord.txid} is ${transactionStatus}`);

  const resTx = await gateway.getOneTransaction(sentRecord.txid);
  const fee = resTx.getNetworkFee();

  await Utils.PromiseAll([
    rawdb.updateWithdrawalsStatus(manager, sentRecord.id, verifiedStatus, event),
    rawdb.updateWithdrawalTxStatus(manager, sentRecord.id, verifiedStatus, null, fee),
    rawdb.updateWithdrawalTxWallets(manager, sentRecord, event, fee),
  ]);

  await lowerThresholdHandle(manager, sentRecord);
}

async function verifierInternalDoProcess(manager: EntityManager, internalRecord: InternalTransfer): Promise<void> {
  const currency = CurrencyRegistry.getOneCurrency(internalRecord.currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  let verifiedStatus = WithdrawalStatus.COMPLETED;
  let event = CollectStatus.COLLECTED;
  const transactionStatus = await gateway.getTransactionStatus(internalRecord.txid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${internalRecord.txid}`);
    await rawdb.updateRecordsTimestamp(manager, InternalTransfer, [internalRecord.id]);
    return;
  }

  if (transactionStatus === TransactionStatus.FAILED) {
    verifiedStatus = WithdrawalStatus.FAILED;
    event = CollectStatus.UNCOLLECTED;
  }
  logger.info(`Transaction ${internalRecord.txid} is ${transactionStatus}`);

  const resTx = await gateway.getOneTransaction(internalRecord.txid);
  const fee = resTx.getNetworkFee();

  if (internalRecord.type === InternalTransferType.COLLECT) {
    return verifyCollectDoProcess(manager, internalRecord, verifiedStatus, event, fee);
  }

  if (internalRecord.type === InternalTransferType.SEED) {
    return verifySeedDoProcess(manager, internalRecord, verifiedStatus, event, fee);
  }
}

async function verifyCollectDoProcess(
  manager: EntityManager,
  internalRecord: InternalTransfer,
  verifiedStatus: WithdrawalStatus,
  event: CollectStatus,
  fee: BigNumber
): Promise<void> {
  const { toAddress } = internalRecord;
  if (!toAddress) {
    throw new Error(`internalTx id=${internalRecord.id} does not have toAddress`);
  }

  const tasks: Array<Promise<any>> = [
    rawdb.updateInternalTransfer(manager, internalRecord, verifiedStatus, fee),
    rawdb.updateDepositCollectStatus(manager, internalRecord, event),
  ];
  const currencyInfo = CurrencyRegistry.getOneCurrency(internalRecord.currency);

  const hotWallet = await rawdb.findHotWalletByAddress(manager, toAddress);

  if (!hotWallet) {
    // transfer to cold wallet
    tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, internalRecord, event, new BigNumber(internalRecord.amount)));
  } else {
    // only minus fee for native coin
    if (currencyInfo.isNative) {
      tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, internalRecord, event, fee));
    } else {
      logger.info(`${currencyInfo.symbol} is not native, do not minus fee`);
      tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, internalRecord, event, new BigNumber(0)));
    }
  }

  await Utils.PromiseAll(tasks);

  if (!hotWallet) {
    logger.info(`wallet id=${internalRecord.walletId} is cold wallet, ignore threshold`);
    return;
  }

  await rawdb.upperThresholdHandle(manager, CurrencyRegistry.getOneCurrency(internalRecord.currency), hotWallet);
}

async function verifySeedDoProcess(
  manager: EntityManager,
  internalRecord: InternalTransfer,
  verifiedStatus: WithdrawalStatus,
  event: CollectStatus,
  fee: BigNumber
): Promise<void> {
  const seeding = await manager.findOne(DepositLog, {
    data: internalRecord.txid,
  });

  if (!seeding) {
    throw new Error(`txid=${internalRecord.txid} is not a seeding tx`);
  }

  const amount = new BigNumber(internalRecord.amount);
  const platformCurrency = CurrencyRegistry.getOneCurrency(internalRecord.currency);
  const platformCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = platformCurrencies.map(c => c.symbol);
  let deposits = await manager.find(Deposit, {
    toAddress: internalRecord.toAddress,
    collectStatus: CollectStatus.SEED_REQUESTED,
    currency: In(allSymbols),
  });

  const tasks: Array<Promise<any>> = [
    rawdb.updateInternalTransfer(manager, internalRecord, verifiedStatus, fee),
    rawdb.updateWalletBalanceOnlyFee(manager, internalRecord, event, amount.plus(fee)),
  ];

  if (event === CollectStatus.COLLECTED) {
    deposits = deposits.map(deposit => {
      deposit.collectStatus = CollectStatus.UNCOLLECTED;
      return deposit;
    });
    tasks.push(manager.save(deposits));
    tasks.push(rawdb.insertDepositLog(manager, seeding.depositId, DepositEvent.SEEDED, internalRecord.id));
  }

  await Utils.PromiseAll(tasks);
}

async function lowerThresholdHandle(manager: EntityManager, sentRecord: WithdrawalTx) {
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
