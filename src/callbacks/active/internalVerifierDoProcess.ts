import {
  TransactionStatus,
  getLogger,
  IWithdrawalProcessingResult,
  Utils,
  BaseInternalTransferVerifier,
  Transaction,
  getListTokenSymbols,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { CollectStatus, DepositEvent, WithdrawalStatus, InternalTransferType } from '../../Enums';
import { HotWallet, Deposit } from '../../entities';
import { InternalTransfer } from '../../entities/InternalTransfer';

const logger = getLogger('internalVerifierDoProcess');
const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function internalVerifierDoProcess(
  verfifier: BaseInternalTransferVerifier
): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult;
  await getConnection().transaction(async manager => {
    result = await _verifierDoProcess(manager, verfifier);
  });
  return result;
}

async function _verifierDoProcess(
  manager: EntityManager,
  verifier: BaseInternalTransferVerifier
): Promise<IWithdrawalProcessingResult> {
  const record = await rawdb.findInternalTransferByCollectStatus(manager, getListTokenSymbols().tokenSymbols, [
    WithdrawalStatus.SENT,
  ]);

  if (!record) {
    logger.info(`Wait until new internal tx`);
    return emptyResult;
  }

  // verify withdrawal information from blockchain network
  const transactionStatus = await verifier.getGateway().getTransactionStatus(record.txid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${record.txid}`);
    return emptyResult;
  }
  logger.info(`Transaction ${record.txid} is ${transactionStatus}`);
  const resTx = await verifier.getGateway().getOneTransaction(record.txid);

  if (record.type === InternalTransferType.COLLECT) {
    return _collectVerify(manager, record, transactionStatus, resTx);
  } else if (record.type === InternalTransferType.SEED) {
    return _seedVerify(manager, record, transactionStatus, resTx);
  }

  return emptyResult;
}

async function _collectVerify(
  manager: EntityManager,
  transfer: InternalTransfer,
  status: TransactionStatus,
  tx: Transaction
): Promise<IWithdrawalProcessingResult> {
  const toAddress = tx.extractRecipientAddresses()[0];
  const [collectingRecord, hotWallet] = await Promise.all([
    manager.getRepository(Deposit).findOne({ collectedTxid: transfer.txid }),
    manager.getRepository(HotWallet).findOne({ address: toAddress }),
  ]);

  if (!collectingRecord || !hotWallet) {
    logger.error('Missing data, cannot verify collecing deposit');
    return emptyResult;
  }

  let event = DepositEvent.COLLECTED;
  let verifiedStatus = CollectStatus.COLLECTED;
  if (status === TransactionStatus.FAILED) {
    event = DepositEvent.COLLECTED_FAILED;
    verifiedStatus = CollectStatus.UNCOLLECTED;
  }
  const fee = tx.getNetworkFee();
  const timestamp = tx.timestamp;

  const tasks = [
    rawdb.updateDepositCollectStatus(manager, collectingRecord.id, verifiedStatus, timestamp),
    rawdb.updateDepositCollectWallets(manager, collectingRecord, event, transfer.amount, fee, hotWallet.isExternal),
    rawdb.updateInternalTransfer(manager, transfer, verifiedStatus, transfer.amount, fee, transfer.walletId),
  ];
  await Utils.PromiseAll(tasks);

  // for collectedtimestamp
  await rawdb.insertDepositLog(manager, collectingRecord.id, event);

  return emptyResult;
}

async function _seedVerify(
  manager: EntityManager,
  transfer: InternalTransfer,
  status: TransactionStatus,
  tx: Transaction
): Promise<IWithdrawalProcessingResult> {
  let verifiedStatus = CollectStatus.COLLECTED;
  if (status === TransactionStatus.FAILED) {
    verifiedStatus = CollectStatus.UNCOLLECTED;
  }
  const fee = tx.getNetworkFee();

  const tasks = [
    rawdb.updateWalletBalanceOnlyFee(manager, transfer, verifiedStatus, fee),
    rawdb.updateInternalTransfer(manager, transfer, verifiedStatus, transfer.amount, fee, transfer.walletId),
  ];
  await Utils.PromiseAll(tasks);

  return emptyResult;
}
