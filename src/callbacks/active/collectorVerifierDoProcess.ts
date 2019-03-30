import {
  TransactionStatus,
  getLogger,
  IWithdrawalProcessingResult,
  BaseDepositCollectorVerifier,
  Utils,
  getListTokenSymbols,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { CollectStatus, DepositEvent } from '../../Enums';
import { HotWallet } from '../../entities';

const logger = getLogger('collectorVerifierDoProcess');
const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function collectorVerifierDoProcess(
  verfifier: BaseDepositCollectorVerifier
): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult;
  await getConnection().transaction(async manager => {
    result = await _verifierDoProcess(manager, verfifier);
  });
  return result;
}

async function _verifierDoProcess(
  manager: EntityManager,
  verifier: BaseDepositCollectorVerifier
): Promise<IWithdrawalProcessingResult> {
  const collectingRecord = await rawdb.findDepositByCollectStatus(manager, getListTokenSymbols().tokenSymbols, [
    CollectStatus.COLLECTING,
  ]);

  if (!collectingRecord) {
    logger.info(`Wait until new collecting tx`);
    return emptyResult;
  }

  let event = DepositEvent.COLLECTED;
  let verifiedStatus = CollectStatus.COLLECTED;
  // verify withdrawal information from blockchain network
  const transactionStatus = await verifier.getGateway().getTransactionStatus(collectingRecord.collectedTxid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${collectingRecord.collectedTxid}, is ${transactionStatus} now`);
    return emptyResult;
  }

  if (transactionStatus === TransactionStatus.FAILED) {
    event = DepositEvent.COLLECTED_FAILED;
    verifiedStatus = CollectStatus.UNCOLLECTED;
  }
  logger.info(`Transaction ${collectingRecord.collectedTxid} is ${transactionStatus}`);

  // TODO: yuu - verify
  const resTx = await verifier.getGateway().getOneTransaction(collectingRecord.collectedTxid);
  const hotWalletAddress = resTx.extractRecipientAddresses()[0];
  const hotWallet = await manager.getRepository(HotWallet).findOne({ address: hotWalletAddress });
  const fee = resTx.getNetworkFee();
  const timestamp = resTx.timestamp;

  const tasks = [
    rawdb.updateDepositCollectStatus(manager, collectingRecord.id, verifiedStatus, timestamp),
    rawdb.updateDepositCollectWallets(manager, collectingRecord, event, '0', fee, hotWallet.isExternal),
  ];
  await Utils.PromiseAll(tasks);

  // for collectedtimestamp
  await rawdb.insertDepositLog(manager, collectingRecord.id, event);

  return emptyResult;
}
