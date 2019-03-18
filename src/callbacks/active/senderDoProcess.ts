import {
  BaseGateway,
  BaseWithdrawalSender,
  getListTokenSymbols,
  getLogger,
  IWithdrawalProcessingResult,
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

  let sentResultObj;
  const prefix: string = 'TMP_';
  const txid = signedRecord.txid;
  if (signedRecord.txid.indexOf(prefix) === -1) {
    const status = await gateway.getTransactionStatus(txid);
    const withdrawalStatus: WithdrawalStatus =
      status === TransactionStatus.COMPLETED || status === TransactionStatus.CONFIRMING
        ? WithdrawalStatus.SENT
        : status === TransactionStatus.FAILED
        ? WithdrawalStatus.FAILED
        : null;
    if (withdrawalStatus) {
      sentResultObj = { txid };
      return updateWithdrawalAndWithdrawalTx(manager, signedRecord, sentResultObj, withdrawalStatus);
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
  sentResultObj: any,
  status: WithdrawalStatus
): Promise<IWithdrawalProcessingResult> {
  let event: WithdrawalEvent;
  if (status === WithdrawalStatus.SENT) {
    // keep withdrawal status and fire sent withdrawal event
    event = WithdrawalEvent.SENT;
  } else if (status === WithdrawalStatus.FAILED) {
    // changed withdrawal status to unsign and fire txid_changed withdrawal event
    status = WithdrawalStatus.UNSIGNED;
    event = WithdrawalEvent.TXID_CHANGED;
  }
  logger.info(`Broadcast successfully ${JSON.stringify(sentResultObj)}`);
  await Utils.PromiseAll([
    rawdb.updateWithdrawalTxStatus(manager, signedRecord.id, status, sentResultObj),
    rawdb.updateWithdrawalsStatus(manager, signedRecord.id, status, event, sentResultObj),
  ]);
  return emptyResult;
}

export { senderDoProcess };
