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
import { WithdrawalStatus, WithdrawalEvent } from '../../Enums';
import { WithdrawalTx } from '../../entities';

const logger = getLogger('verifierDoProcess');

export async function verifierDoProcess(verfifier: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _verifierDoProcess(manager, verfifier);
  });
}

/**
 * Tasks of verifier:
 * - Find one withdrawal_tx record that has `status` = `sent`
 * - Check whether the txid is confirmed on the blockchain network
 * - Update the status of corresponding withdrawal and withdrawal_tx records
 *
 * @param manager
 * @param verifier
 */
async function _verifierDoProcess(manager: EntityManager, verifier: BasePlatformWorker): Promise<void> {
  const platformCurrency = verifier.getCurrency();
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = allCurrencies.map(c => c.symbol);
  const sentRecord = await rawdb.findOneWithdrawalTx(manager, allSymbols, [WithdrawalStatus.SENT]);

  if (!sentRecord) {
    logger.info(`There are not sent withdrawals to be verified: platform=${platformCurrency.platform}`);
    return;
  }

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

  return;
}
