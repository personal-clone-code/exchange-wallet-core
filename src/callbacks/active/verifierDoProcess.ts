import {
  TransactionStatus,
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  GatewayRegistry,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalStatus, WithdrawalEvent, InternalTransferType, CollectStatus } from '../../Enums';
import { WithdrawalTx, InternalTransfer } from '../../entities';

const logger = getLogger('verifierDoProcess');

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
    return _verifierWithdrawalDoProcess(manager, sentRecord);
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
  return _verifierInternalDoProcess(manager, internalRecord);
}

async function _verifierWithdrawalDoProcess(manager: EntityManager, sentRecord: WithdrawalTx): Promise<void> {
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
}

async function _verifierInternalDoProcess(manager: EntityManager, internalRecord: InternalTransfer): Promise<void> {
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
    const tasks: Array<Promise<any>> = [
      rawdb.updateInternalTransfer(manager, internalRecord, verifiedStatus, fee),
      rawdb.updateDepositCollectStatus(manager, internalRecord, event),
    ];
    const currencyInfo = CurrencyRegistry.getOneCurrency(internalRecord.currency);
    if (currencyInfo.isNative) {
      // update fee in wallet balance
      tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, internalRecord, event, fee));
    }
    await Utils.PromiseAll(tasks);
    return;
  }
}
