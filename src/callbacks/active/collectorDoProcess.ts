import {
  IWithdrawalProcessingResult,
  getLogger,
  BaseDepositCollector,
  Transaction,
  Utils,
  getListTokenSymbols,
  isPlatform,
  getCurrency,
  getMinimumDepositAmount,
} from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { CollectStatus, InternalTransferType, WithdrawalStatus } from '../../Enums';
import { Deposit } from '../../entities';
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

  const minimumDepositAmount = getMinimumDepositAmount(unCollectedDeposit.currency);
  if (!minimumDepositAmount) {
    logger.error(`Minimum deposit is not setted for ${unCollectedDeposit.currency}`);
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

async function _collectDepositTransaction(
  manager: EntityManager,
  collector: BaseDepositCollector,
  deposit: Deposit
): Promise<Transaction> {
  const currency = getCurrency();
  const addressEntity = collector.getAddressEntity();
  const gateway = collector.getGateway(currency);

  const address: any = await manager.getRepository(addressEntity).findOne({ address: deposit.toAddress });
  if (!address) {
    logger.error(`Cannot find address=${deposit.toAddress}.`);
    return null;
  }
  let privateKey = address.privateKey;
  if (address.kmsDataKeyId !== 0) {
    privateKey = await Kms.getInstance().decrypt(address.privateKey, address.kmsDataKeyId);
  }

  // TODO: What's the right way to find hot wallet?
  let hotWallet = await rawdb.findAvailableHotWallet(manager, currency, false);
  if (hotWallet) {
    logger.info(`${currency} internal hot wallet is available, internal mode`);
  } else {
    logger.info(`${currency} internal hot wallet is not available, external mode`);
    hotWallet = await rawdb.findAvailableHotWallet(manager, currency, true);
  }

  if (!hotWallet) {
    logger.error(`${currency} hot wallet is not available`);
    return null;
  }

  const result = await gateway.forwardTransaction(privateKey, address.address, hotWallet.address, deposit.amount);
  if (!result) {
    return result;
  }

  deposit.collectedTxid = result.txid;
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
