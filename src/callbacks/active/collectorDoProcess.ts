import {
  IWithdrawalProcessingResult,
  getLogger,
  BaseDepositCollector,
  Transaction,
  Utils,
  getListTokenSymbols,
  isPlatform,
  getMinimumDepositAmount,
  getCurrencyDecimal,
  getFamily,
} from 'sota-common';
import BN from 'bignumber.js';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { CollectStatus, InternalTransferType, WithdrawalStatus, DepositEvent } from '../../Enums';
import { Deposit, Wallet, Address } from '../../entities';
import Kms from '../../encrypt/Kms';

const logger = getLogger('collectorDoProcess');

const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function collectorDoProcess(collector: BaseDepositCollector): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult;
  await getConnection().transaction(async manager => {
    result = await _collectorDoProcess(manager, collector);
  });
  return result;
}

/**
 * Picker do process
 * @param manager
 * @param picker
 * @private
 */
async function _collectorDoProcess(
  manager: EntityManager,
  collector: BaseDepositCollector
): Promise<IWithdrawalProcessingResult> {
  const now = Date.now();
  const unCollectedDeposit = await rawdb.findDepositByCollectStatus(
    manager,
    getListTokenSymbols().tokenSymbols,
    [CollectStatus.UNCOLLECTED],
    '0'
  );
  if (!unCollectedDeposit) {
    logger.info(`There're no uncollected deposit right now. Will try to process later...`);
    return emptyResult;
  }

  try {
    await _collectDepositTransaction(manager, collector, unCollectedDeposit);
  } catch (err) {
    logger.error(
      `Can not collector transaction txid=${unCollectedDeposit.txid}, address=${unCollectedDeposit.toAddress}.`
    );
    logger.error(`===============================`);
    logger.error(err);
    logger.error(`===============================`);

    unCollectedDeposit.nextCheckAt = now + collector.getNextCheckAtAmount();
    await manager.save(unCollectedDeposit);
    // assume insufficient balance
    if (!isPlatform(unCollectedDeposit.currency)) {
      await collector.emitMessage(`seed,${unCollectedDeposit.id},${unCollectedDeposit.toAddress}`);
    }

    return emptyResult;
  }

  return emptyResult;
}

/**
 * Try to collect funds from every single deposit address to the hot wallet
 *
 * @param manager
 * @param collector
 * @param deposit
 */
async function _collectDepositTransaction(
  manager: EntityManager,
  collector: BaseDepositCollector,
  deposit: Deposit
): Promise<Transaction> {
  const now = Utils.now();
  const currency = getFamily();
  const addressEntity = collector.getAddressEntity();
  const gateway = collector.getGateway(deposit.currency);

  const minimumDepositAmount = getMinimumDepositAmount(deposit.currency);
  if (!minimumDepositAmount) {
    logger.error(`Minimum deposit is not setted for ${deposit.currency}`);
    return null;
  }

  const factor = new BN(10).pow(getCurrencyDecimal(deposit.currency));
  const minNumber = new BN(minimumDepositAmount).multipliedBy(factor);
  const amountNumber = new BN(deposit.amount);
  if (amountNumber.lt(minNumber)) {
    logger.error(
      `Deposit amount less than threshold \
      depositId=${deposit.id} \
      currency=${deposit.currency} \
      amount=${deposit.amount} < threshold=${minNumber}`
    );
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'AMOUNT_BELOW_THRESHOLD';
    await rawdb.insertDepositLog(manager, deposit.id, DepositEvent.NOTCOLLECT);
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  const address: any = await manager.getRepository(addressEntity).findOne({ address: deposit.toAddress });
  if (!address) {
    logger.error(`Cannot collect depositId=${deposit.id} because of address not found: ${deposit.toAddress}.`);
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'INVALID_ADDRESS';
    await rawdb.insertDepositLog(manager, deposit.id, DepositEvent.NOTCOLLECT);
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  const genericAddress = await manager.getRepository(Address).findOne({ address: deposit.toAddress });
  if (genericAddress.isExternal) {
    logger.error(`Does not collect external address' deposit: id=${deposit.id} address=${deposit.toAddress}`);
    deposit.collectStatus = CollectStatus.COLLECTED;
    deposit.collectedTxid = 'NO_COLLECT_EXTERNAL_ADDRESS';
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  const isCollectable = await collector.isCollectable(deposit.txid, deposit.toAddress, deposit.amount);
  if (!isCollectable) {
    logger.error(`Deposit is already collected id=${deposit.id} txid=${deposit.txid} address=${deposit.toAddress}`);
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'COLLECTED_SOMEWHERE_ALREADY';
    await rawdb.insertDepositLog(manager, deposit.id, DepositEvent.NOTCOLLECT);
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  let privateKey = address.privateKey;
  if (address.kmsDataKeyId !== 0) {
    privateKey = await Kms.getInstance().decrypt(address.privateKey, address.kmsDataKeyId);
  }

  const walletId = deposit.walletId;

  // TODO: What's the right way to find hot wallet?
  let hotWallet = await rawdb.findAvailableHotWallet(manager, walletId, currency, false);
  if (hotWallet) {
    logger.info(`${currency} internal hot wallet is available, internal mode`);
  } else {
    logger.info(`${currency} internal hot wallet is not available, external mode`);
    hotWallet = await rawdb.findAvailableHotWallet(manager, walletId, currency, true);
  }

  if (!hotWallet) {
    logger.error(`No hot wallet is available depositId=${deposit.id} walletId=${walletId} currency=${currency}`);
    deposit.nextCheckAt = now + collector.getNextCheckAtAmount();
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  const result = await gateway.forwardTransaction(privateKey, address.address, hotWallet.address, deposit.amount);
  if (!result) {
    logger.error(`Construct collect tx failed depositId=${deposit.id} walletId=${walletId} currency=${currency}`);
    deposit.nextCheckAt = now + collector.getNextCheckAtAmount();
    await manager.getRepository(Deposit).save(deposit);
    return null;
  }

  deposit.collectedTxid = result.txid;
  deposit.nextCheckAt = 0;
  deposit.collectStatus = CollectStatus.COLLECTING;
  await Utils.PromiseAll([
    rawdb.insertInternalTransfer(manager, {
      currency: deposit.currency,
      txid: result.txid,
      type: InternalTransferType.COLLECT,
      status: WithdrawalStatus.SENT,
      fromAddress: deposit.toAddress,
      toAddress: hotWallet.address,
    }),
    manager.save(deposit),
  ]);

  return result;
}

export default collectorDoProcess;
