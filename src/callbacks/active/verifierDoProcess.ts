import {
  BaseWithdrawalVerifier,
  TransactionStatus,
  getLogger,
  IWithdrawalProcessingResult,
  Utils,
  BaseGateway,
  getListTokenSymbols,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalStatus, WithdrawalEvent } from '../../Enums';

const logger = getLogger('verifierDoProcess');
const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function verifierDoProcess(verfifier: BaseWithdrawalVerifier): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult = null;
  await getConnection().transaction(async manager => {
    result = await _verifierDoProcess(manager, verfifier);
  });
  return result;
}

async function _verifierDoProcess(
  manager: EntityManager,
  verifier: BaseWithdrawalVerifier
): Promise<IWithdrawalProcessingResult> {
  const nextCurrency = await rawdb.getNextCurrencyByStatus(manager, getListTokenSymbols().tokenSymbols, [
    WithdrawalStatus.SENT,
  ]);

  if (!nextCurrency) {
    logger.info(`There are not sent ${getListTokenSymbols().tokenSymbolsBuilder.toUpperCase()} withdrawals to process`);
    return emptyResult;
  }

  const currency = nextCurrency;
  const gateway = verifier.getGateway(currency);
  return _verifierSubDoProcess(manager, currency, gateway);
}

async function _verifierSubDoProcess(manager: EntityManager, currency: string, gateway: BaseGateway) {
  const sentRecord = await rawdb.findWithdrawalTxByStatus(manager, currency, [WithdrawalStatus.SENT]);

  if (!sentRecord) {
    logger.info(`Wait until new sent tx`);
    return emptyResult;
  }

  let event = WithdrawalEvent.COMPLETED;
  let verifiedStatus = WithdrawalStatus.COMPLETED;
  // verify withdrawal information from blockchain network
  const transactionStatus = await gateway.getTransactionStatus(sentRecord.txid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${sentRecord.txid}`);
    return emptyResult;
  }

  if (transactionStatus === TransactionStatus.FAILED) {
    event = WithdrawalEvent.FAILED;
    verifiedStatus = WithdrawalStatus.FAILED;
  }
  logger.info(`Transaction ${sentRecord.txid} is ${transactionStatus}`);

  const resTx = await gateway.getOneTransaction(sentRecord.txid);
  const fee = resTx.getNetworkFee();

  await Utils.PromiseAll([
    rawdb.updateWithdrawalTxStatus(manager, sentRecord.id, verifiedStatus, null, fee),
    rawdb.updateWithdrawalTxWallets(manager, sentRecord, event, fee),
    rawdb.updateWithdrawalsStatus(manager, sentRecord.id, verifiedStatus, event),
  ]);

  return emptyResult;
}
