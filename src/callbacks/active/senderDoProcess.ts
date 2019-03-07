import { BaseGateway, getLogger, IWithdrawalProcessingResult, Utils, getListTokenSymbols } from 'sota-common';
import { BaseWithdrawalSender } from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalEvent, WithdrawalStatus } from '../../Enums';
import util from 'util';

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
  try {
    sentResultObj = await gateway.sendRawTransaction(signedRecord.signedRaw);
  } catch (e) {
    logger.error(`Cannot broadcast withdrawlTxId=${signedRecord.id} due to error=${util.inspect(e)}`);
    return emptyResult;
  }

  if (sentResultObj) {
    logger.info(`Broadcast successfully ${JSON.stringify(sentResultObj)}`);
    await Utils.PromiseAll([
      rawdb.updateWithdrawalTxStatus(manager, signedRecord.id, WithdrawalStatus.SENT, sentResultObj),
      rawdb.updateWithdrawalsStatus(
        manager,
        signedRecord.id,
        WithdrawalStatus.SENT,
        WithdrawalEvent.SENT,
        sentResultObj
      ),
    ]);
  } else {
    logger.error(`Could not send raw transaction. Result is empty, please check...`);
  }

  return emptyResult;
}

export { senderDoProcess };
