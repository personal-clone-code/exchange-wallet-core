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
import { HotWallet, Deposit, Address } from '../../entities';
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
  const [collectingRecord, hotWallet, address] = await Promise.all([
    manager.getRepository(Deposit).findOne({ collectedTxid: transfer.txid }),
    manager.getRepository(HotWallet).findOne({ address: transfer.toAddress }),
    manager.getRepository(Address).findOne({ address: transfer.fromAddress }),
  ]);

  if (!collectingRecord || !hotWallet || !address) {
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
  const outputs = tx.extractTransferOutputs().filter(output => output.toAddress === transfer.toAddress);
  // asumme one out
  const amount = outputs[0].amount;
  const timestamp = tx.timestamp;

  const tasks = [
    rawdb.updateDepositCollectStatus(manager, collectingRecord.id, verifiedStatus, timestamp),
    rawdb.updateDepositCollectWallets(manager, collectingRecord, event, amount, fee, hotWallet.isExternal),
    rawdb.updateInternalTransfer(manager, transfer, verifiedStatus, amount, fee, address.walletId),
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
  const [hotWallet, address] = await Promise.all([
    manager.getRepository(HotWallet).findOne({ address: transfer.fromAddress }),
    manager.getRepository(Address).findOne({ address: transfer.toAddress }),
  ]);

  if (!hotWallet || !address) {
    logger.error('Missing data, cannot verify collecing deposit');
    return emptyResult;
  }

  let verifiedStatus = CollectStatus.COLLECTED;
  if (status === TransactionStatus.FAILED) {
    verifiedStatus = CollectStatus.UNCOLLECTED;
  }
  const fee = tx.getNetworkFee();
  const outputs = tx.extractTransferOutputs().filter(output => output.toAddress === transfer.toAddress);
  // asumme one out
  const amount = outputs[0].amount;

  const tasks = [
    rawdb.updateWalletBalanceOnlyFee(manager, transfer, address, verifiedStatus, fee),
    rawdb.updateInternalTransfer(manager, transfer, verifiedStatus, amount, fee, address.walletId),
  ];
  await Utils.PromiseAll(tasks);

  return emptyResult;
}
