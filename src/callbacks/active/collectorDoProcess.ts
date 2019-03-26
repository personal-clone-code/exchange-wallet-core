import {
  getLogger,
  BaseDepositCollector,
  Utils,
  getListTokenSymbols,
  isPlatform,
  getMinimumDepositAmount,
  getCurrencyDecimal,
  getFamily,
  IWithdrawalProcessingResult,
  getCurrency,
} from 'sota-common';
import BN from 'bignumber.js';
import { EntityManager, getConnection, In } from 'typeorm';
import * as rawdb from '../../rawdb';
import { CollectStatus } from '../../Enums';
import { Deposit, Address } from '../../entities';
import Kms from '../../encrypt/Kms';
import _ = require('lodash');

const logger = getLogger('collectorDoProcess');

const emptyResult: IWithdrawalDoProcessingResult = {
  deposits: [],
  satisfiedDeposits: [],
  rawTransaction: null,
  needNextProcess: false,
  withdrawalTxId: null,
};

export interface IWithdrawalDoProcessingResult extends IWithdrawalProcessingResult {
  deposits: Deposit[];
  satisfiedDeposits: Deposit[];
  rawTransaction: any;
}

interface IForwardingInputs {
  addresses: string | string[];
  privateKeys: string | string[];
  satisfiedDeposits: Deposit[];
}

interface IDepositsTotalAmount {
  ok: boolean;
  totalDepositAmount: string;
}

export async function collectorDoProcess(collector: BaseDepositCollector): Promise<IWithdrawalDoProcessingResult> {
  let doProcessResult: IWithdrawalDoProcessingResult = null;
  await getConnection().transaction(async manager => {
    doProcessResult = await _collectorDoProcess(manager, collector);
  });

  let submitResult: any;
  await getConnection().transaction(async manager => {
    submitResult = await _collectorSubmitProcess(manager, collector, doProcessResult);
  });
  return doProcessResult;
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
): Promise<IWithdrawalDoProcessingResult> {
  const currencyGateway = collector.getGateway(getCurrency());
  const unCollectedDeposits = await rawdb.findDepositsByCollectStatus(
    manager,
    getListTokenSymbols().tokenSymbols,
    [CollectStatus.UNCOLLECTED],
    currencyGateway.getTransferType()
  );
  if (!unCollectedDeposits.length) {
    logger.info(`There're no uncollected deposit right now. Will try to process later...`);
    return emptyResult;
  }

  const result = await _collectDepositTransaction(manager, collector, unCollectedDeposits);
  return result;
}

/**
 * TODO: log internal transaction into database
 * Picker do process
 * @param manager
 * @param picker
 * @private
 */
async function _collectorSubmitProcess(
  manager: EntityManager,
  collector: BaseDepositCollector,
  doProcessResult: IWithdrawalDoProcessingResult
): Promise<void> {
  if (doProcessResult === emptyResult) {
    return;
  }
  const depositCurrency = doProcessResult.deposits[0].currency;
  const gateway = collector.getGateway(depositCurrency);

  try {
    await gateway.sendRawTransaction(doProcessResult.rawTransaction);
  } catch (e) {
    logger.error(
      `Can not send transaction txid=${doProcessResult.satisfiedDeposits[0].collectedTxid}, address=${
        doProcessResult.deposits[0].toAddress
      }.`
    );
    logger.error(`===============================`);
    logger.error(e);
    logger.error(`===============================`);
    if (!isPlatform(doProcessResult.deposits[0].currency)) {
      await Promise.all(
        doProcessResult.satisfiedDeposits.map(async deposit => {
          await collector.emitMessage(`seed,${deposit.id},${deposit.toAddress}`);
        })
      );
    }
  }
  // after sent, update status to collecting
  const satisfiedDeposit = doProcessResult.satisfiedDeposits;
  satisfiedDeposit.forEach(deposit => {
    deposit.collectStatus = CollectStatus.COLLECTING;
    deposit.updatedAt = Utils.nowInMillis();
  });

  await manager.save(satisfiedDeposit);
  return;
}

/**
 * Try to collect funds from many deposits to the hot wallet
 *
 * @param manager
 * @param collector
 * @param deposits
 */
async function _collectDepositTransaction(
  manager: EntityManager,
  collector: BaseDepositCollector,
  deposits: Deposit[]
): Promise<IWithdrawalDoProcessingResult> {
  const currency = getFamily();
  const depositCurrency = deposits[0].currency;
  const walletId = deposits[0].walletId;
  const gateway = collector.getGateway(depositCurrency);

  const checkDepositAmounts = await _checkDepositAmount(manager, deposits);
  let satisfyDeposit: any[] = [];
  let unsatisfyDeposit: any[] = [];
  let forwardResult: any;

  // pre-checking
  if (checkDepositAmounts.ok) {
    // TODO: What's the right way to find hot wallet?
    let hotWallet = await rawdb.findAnyHotWallet(manager, walletId, currency, false);
    if (hotWallet) {
      logger.info(`${currency} internal hot wallet is available, internal mode`);
    } else {
      logger.info(`${currency} internal hot wallet is not available, external mode`);
      hotWallet = await rawdb.findAnyHotWallet(manager, walletId, currency, true);
    }

    const forwardInputs = await _getForwardingInputs(manager, deposits);
    if (hotWallet) {
      forwardResult = await gateway.forwardTransaction(
        forwardInputs.privateKeys,
        forwardInputs.addresses,
        hotWallet.address,
        checkDepositAmounts.totalDepositAmount,
        deposits.map(deposit => deposit.txid)
      );
    }
    satisfyDeposit = forwardInputs.satisfiedDeposits;
    unsatisfyDeposit = _.difference(deposits, satisfyDeposit);
  }

  unsatisfyDeposit.forEach(deposit => {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'INVALID_ADDRESS';
    deposit.updatedAt = Utils.nowInMillis();
  });
  satisfyDeposit.forEach(deposit => {
    if (forwardResult) {
      // MAKE SURE DEPOSIT WILL BE NOT RESENT, IF TRANSACTION SENT BUT IT IS NOT UPDATED STATUS TO COLLECTING
      deposit.collectStatus = CollectStatus.COLLECTING_FORWARDING;
      deposit.collectedTxid = forwardResult.txid;
    }
    deposit.updatedAt = Utils.nowInMillis();
  });

  await Utils.PromiseAll([manager.save(satisfyDeposit), manager.save(unsatisfyDeposit)]);

  return {
    deposits,
    satisfiedDeposits: satisfyDeposit,
    rawTransaction: forwardResult.signedRaw,
    needNextProcess: true,
    withdrawalTxId: 0,
  };
}

/**
 * Check total amount of deposit records with set minimum deposit amount
 * @param manager
 * @param collector
 * @param deposits
 * @private
 */
async function _checkDepositAmount(manager: EntityManager, deposits: Deposit[]): Promise<IDepositsTotalAmount> {
  let amountNumber = new BN(0);
  deposits.forEach(deposit => {
    amountNumber = amountNumber.plus(new BN(deposit.amount));
  });
  const depositCurrency = deposits[0].currency;
  const minimumDepositAmount = getMinimumDepositAmount(depositCurrency);
  if (!minimumDepositAmount) {
    logger.error(`Minimum deposit is not setted for ${depositCurrency}`);
    return {
      ok: false,
      totalDepositAmount: amountNumber.toString(),
    };
  }

  const factor = new BN(10).pow(getCurrencyDecimal(depositCurrency));
  const minNumber = new BN(minimumDepositAmount).multipliedBy(factor);

  if (amountNumber.lt(minNumber)) {
    logger.error(
      `Deposit amount less than threshold` +
        ` depositId=${deposits.map(deposit => deposit.id)}` +
        ` currency=${deposits[0].currency}` +
        ` amount=${amountNumber.toString()} < threshold=${minNumber}`
    );
    deposits.forEach(deposit => {
      deposit.updatedAt = Utils.nowInMillis();
      deposit.collectedTxid = 'AMOUNT_BELOW_THRESHOLD';
    });
    await manager.getRepository(Deposit).save(deposits);
    return {
      ok: false,
      totalDepositAmount: amountNumber.toString(),
    };
  }
  return {
    ok: true,
    totalDepositAmount: amountNumber.toString(),
  };
}

/**
 * Get list sender addresses and private keys to forward transaction
 * @param manager
 * @param collector
 * @param deposits
 * @private
 */
async function _getForwardingInputs(manager: EntityManager, deposits: Deposit[]): Promise<IForwardingInputs> {
  const depositAddress = deposits.map(deposit => deposit.toAddress);
  const uniqueDepositAddress: string[] = Array.from(new Set(depositAddress.map((addr: string) => addr)));

  // get list address
  const addresses = await manager.getRepository(Address).find({ address: In(uniqueDepositAddress), isExternal: 0 });

  const stringAddrs: string[] = addresses.map(addr => addr.address);
  const privateKeys: string[] = [];

  await Promise.all(
    addresses.map(async addr => {
      let privateKey: string = null;
      let kmsDataKeyId: number;

      try {
        const privateKeyDef = JSON.parse(addr.secret);
        privateKey = privateKeyDef.private_key;
        kmsDataKeyId = privateKeyDef.kms_data_key_id;

        if (kmsDataKeyId !== 0) {
          privateKey = await Kms.getInstance().decrypt(privateKey, kmsDataKeyId);
        }
      } catch (e) {
        privateKey = addr.secret;
      }

      privateKeys.push(privateKey);
    })
  );

  const satisfiedDeposits = deposits.filter(deposit => stringAddrs.indexOf(deposit.toAddress) !== -1);
  return {
    addresses: addresses.length === 1 ? addresses[0].address : stringAddrs,
    privateKeys: privateKeys.length === 1 ? privateKeys[0] : privateKeys,
    satisfiedDeposits,
  };
}

export default collectorDoProcess;
