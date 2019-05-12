// TODO: Revive me please...
export async function senderDoProcess(): Promise<void> {
  return;
}

/*
import {
  BaseGateway,
  BaseWithdrawalSender,
  getListTokenSymbols,
  getLogger,
  IWithdrawalProcessingResult,
  ISubmittedTransaction,
  TransactionStatus,
  Utils,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalEvent, WithdrawalStatus } from '../../Enums';
import util from 'util';
import { WithdrawalTx } from '../../entities';

const logger = getLogger('senderDoProcess');

const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export default async function senderDoProcess(sender: BaseWithdrawalSender): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult = null;
  await getConnection().transaction(async manager => {
    result = await _senderDoProcess(manager, sender);
  });
  return result;
}

async function _senderDoProcess(
  manager: EntityManager,
  sender: BaseWithdrawalSender
): Promise<IWithdrawalProcessingResult> {
  const nextCurrency = await rawdb.getNextCurrencyByStatus(manager, getListTokenSymbols().tokenSymbols, [
    WithdrawalStatus.SIGNED,
  ]);

  if (!nextCurrency) {
    logger.info(
      `There are not signed ${getListTokenSymbols().tokenSymbolsBuilder.toUpperCase()} withdrawals to process`
    );
    return emptyResult;
  }

  const currency = nextCurrency;
  const gateway = sender.getGateway(currency);
  return _senderSubDoProcess(manager, currency, gateway);
}

async function _senderSubDoProcess(manager: EntityManager, currency: string, gateway: BaseGateway) {
  const signedRecord = await rawdb.findWithdrawalTxByStatus(manager, currency, [WithdrawalStatus.SIGNED]);
  if (!signedRecord) {
    logger.info(`Wait until new signed tx`);
    return emptyResult;
  }

  let sentResultObj: ISubmittedTransaction = null;
  const prefix: string = 'TMP_';
  const txid = signedRecord.txid;

  // If transaction has valid is, not the temporary one
  // We'll check whether its status is determined or not on the network
  if (signedRecord.txid.indexOf(prefix) === -1) {
    const status = await gateway.getTransactionStatus(txid);

    // If transaction status is completed or confirming, both mean the withdrawal was submitted to network successfully
    if (status === TransactionStatus.COMPLETED || status === TransactionStatus.CONFIRMING) {
      return updateWithdrawalAndWithdrawalTx(manager, signedRecord, { txid }, WithdrawalStatus.SENT);
    }

    // If transaction is determined as failed, the withdrawal is failed as well
    if (status === TransactionStatus.FAILED) {
      return updateWithdrawalAndWithdrawalTx(manager, signedRecord, { txid }, WithdrawalStatus.FAILED);
    }
  }

  // for unknown transaction or temporary transaction
  // send transaction directly
  try {
    sentResultObj = await gateway.sendRawTransaction(signedRecord.signedRaw);
  } catch (e) {
    logger.error(`Cannot broadcast withdrawlTxId=${signedRecord.id} due to error=${util.inspect(e)}`);
    return emptyResult;
  }

  if (sentResultObj) {
    return updateWithdrawalAndWithdrawalTx(manager, signedRecord, sentResultObj, WithdrawalStatus.SENT);
  } else {
    logger.error(`Could not send raw transaction. Result is empty, please check...`);
  }

  return emptyResult;
}

async function updateWithdrawalAndWithdrawalTx(
  manager: EntityManager,
  signedRecord: WithdrawalTx,
  sentResultObj: ISubmittedTransaction,
  status: WithdrawalStatus.SENT | WithdrawalStatus.FAILED
): Promise<IWithdrawalProcessingResult> {
  let event: WithdrawalEvent;
  let newStatus: WithdrawalStatus;
  if (status === WithdrawalStatus.SENT) {
    // keep withdrawal status and fire sent withdrawal event
    newStatus = WithdrawalStatus.SENT;
    event = WithdrawalEvent.SENT;
  } else if (status === WithdrawalStatus.FAILED) {
    // changed withdrawal status to unsign and fire txid_changed withdrawal event
    newStatus = WithdrawalStatus.UNSIGNED;
    event = WithdrawalEvent.TXID_CHANGED;
  }

  logger.info(`Broadcast successfully ${JSON.stringify(sentResultObj)}`);

  await Utils.PromiseAll([
    rawdb.updateWithdrawalTxStatus(manager, signedRecord.id, newStatus, sentResultObj),
    rawdb.updateWithdrawalsStatus(manager, signedRecord.id, newStatus, event, sentResultObj),
  ]);

  return emptyResult;
}

export { senderDoProcess };
*/
