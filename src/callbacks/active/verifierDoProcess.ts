import * as _ from 'lodash';
import {
  TransactionStatus,
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  GatewayRegistry,
  BigNumber,
  BlockHeader,
  Transaction,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection, In } from 'typeorm';
import {
  WithdrawalStatus,
  WithdrawalEvent,
  CollectStatus,
  DepositEvent,
  WalletEvent,
  LocalTxType,
  LocalTxStatus,
} from '../../Enums';
import { LocalTx, DepositLog, Deposit, Wallet } from '../../entities';

const logger = getLogger('verifierDoProcess');

export async function verifierDoProcess(verfifier: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _verifierDoProcess(manager, verfifier);
  });
}

/**
 * Tasks of verifier:
 * - Find one localTx record that has `status` = `sent`
 * - Check whether the txid is confirmed on the blockchain network
 * - Update the status of corresponding related tables and localTx records
 *
 * @param manager
 * @param verifier
 */
async function _verifierDoProcess(manager: EntityManager, verifier: BasePlatformWorker): Promise<void> {
  const platformCurrency = verifier.getCurrency();
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = allCurrencies.map(c => c.symbol);
  const sentRecord = await rawdb.findOneLocalTx(manager, allSymbols, [LocalTxStatus.SENT]);

  if (!sentRecord) {
    logger.info(`There are not sent localTxs to be verified: platform=${platformCurrency.platform}`);
    return;
  }

  logger.info(`Found localTx need verifying: txid=${sentRecord.txid}`);

  const currency = CurrencyRegistry.getOneCurrency(sentRecord.currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  const transactionStatus = await gateway.getTransactionStatus(sentRecord.txid);
  if (transactionStatus === TransactionStatus.UNKNOWN || transactionStatus === TransactionStatus.CONFIRMING) {
    logger.info(`Wait until new tx state ${sentRecord.txid}`);
    await rawdb.updateRecordsTimestamp(manager, LocalTx, [sentRecord.id]);
    return;
  }
  logger.info(`Transaction ${sentRecord.txid} is ${transactionStatus}`);

  let resTx: Transaction;
  // TODO: FIXME
  // This is a workaround. Should be refactored later
  if (currency.symbol.startsWith(`erc20.`)) {
    const resTxs = await (gateway as any).getTransactionsByTxid(sentRecord.txid);
    resTx = resTxs[0];
    // resTx = _.find(resTxs, tx => tx.toAddress === sentRecord.toAddress);
    // if (!resTx) {
    //   logger.error(`Not found any res tx to address: ${sentRecord.toAddress} by txid=${sentRecord.txid}`);
    //   return;
    // }
  } else {
    resTx = await gateway.getOneTransaction(sentRecord.txid);
  }
  const fee = resTx.getNetworkFee();

  const isTxSucceed = transactionStatus === TransactionStatus.COMPLETED;
  if (sentRecord.isWithdrawal()) {
    await verifierWithdrawalDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block);
  } else if (sentRecord.isCollectTx()) {
    await verifyCollectDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block);
  } else if (sentRecord.isSeedTx()) {
    await verifySeedDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block);
  } else {
    logger.error(`verifierDoProcess not supported localTxType: ${sentRecord.type}`);
  }
}

async function verifierWithdrawalDoProcess(
  manager: EntityManager,
  sentRecord: LocalTx,
  isTxSucceed: boolean,
  fee: BigNumber,
  blockHeader: BlockHeader
): Promise<void> {
  const event = isTxSucceed ? WithdrawalEvent.COMPLETED : WithdrawalEvent.FAILED;
  const withdrawStatus = isTxSucceed ? WithdrawalStatus.COMPLETED : WithdrawalStatus.FAILED;
  const localTxStatus = isTxSucceed ? LocalTxStatus.COMPLETED : LocalTxStatus.FAILED;

  await Utils.PromiseAll([
    rawdb.updateWithdrawalsStatus(manager, sentRecord.id, withdrawStatus, event),
    rawdb.updateLocalTxStatus(manager, sentRecord.id, localTxStatus, null, fee, blockHeader),
    rawdb.updateWithdrawalTxWallets(manager, sentRecord, event, fee),
  ]);

  await rawdb.lowerThresholdHandle(manager, sentRecord);
}

async function verifyCollectDoProcess(
  manager: EntityManager,
  localTx: LocalTx,
  isTxSucceed: boolean,
  fee: BigNumber,
  blockHeader: BlockHeader
): Promise<void> {
  const event = isTxSucceed ? DepositEvent.COLLECTED : DepositEvent.COLLECTED_FAILED;
  const collectStatus = isTxSucceed ? CollectStatus.COLLECTED : CollectStatus.UNCOLLECTED;
  const localTxStatus = isTxSucceed ? LocalTxStatus.COMPLETED : LocalTxStatus.FAILED;

  const tasks: Array<Promise<any>> = [
    rawdb.updateLocalTxStatus(manager, localTx.id, localTxStatus, null, fee, blockHeader),
    rawdb.updateDepositCollectStatusByCollectTxId(manager, localTx, collectStatus, event),
  ];

  const { toAddress } = localTx;
  if (!toAddress) {
    throw new Error(`localTx id=${localTx.id} does not have toAddress`);
  }

  if (isTxSucceed) {
    let amount = new BigNumber(0);
    if (localTx.currency.startsWith(`erc20.`)) {
      const gateway = GatewayRegistry.getGatewayInstance(localTx.currency);
      const resTxs = await (gateway as any).getTransactionsByTxid(localTx.txid);
      resTxs.forEach((tx: any) => {
        if (tx.toAddress !== toAddress) {
          return;
        }
        amount = amount.plus(tx.amount);
      });
    } else {
      amount = new BigNumber(localTx.amount);
    }
    tasks.push(rawdb.updateWalletBalanceAfterCollecting(manager, localTx, amount));
  }

  const hotWallet = await rawdb.findHotWalletByAddress(manager, toAddress);

  if (!hotWallet) {
    // transfer to cold wallet
    tasks.push(
      rawdb.updateWalletBalanceOnlyFee(
        manager,
        localTx,
        collectStatus,
        new BigNumber(localTx.amount).minus(fee),
        WalletEvent.COLLECT_AMOUNT
      )
    );
    tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, WalletEvent.COLLECT_FEE));
  } else {
    // only minus fee for native coin
    const currencyInfo = CurrencyRegistry.getOneCurrency(localTx.currency);
    if (currencyInfo.isNative) {
      tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, WalletEvent.COLLECT_FEE));
    } else {
      logger.info(`${currencyInfo.symbol} is not native, do not minus fee`);
      tasks.push(
        rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, new BigNumber(0), WalletEvent.COLLECT_FEE)
      );
    }
  }

  await Utils.PromiseAll(tasks);

  if (!hotWallet) {
    logger.info(`wallet id=${localTx.walletId} is cold wallet, ignore threshold`);
    return;
  }

  await rawdb.upperThresholdHandle(manager, CurrencyRegistry.getOneCurrency(localTx.currency), hotWallet);
}

async function verifySeedDoProcess(
  manager: EntityManager,
  localTx: LocalTx,
  isTxSucceed: boolean,
  fee: BigNumber,
  blockHeader: BlockHeader
): Promise<void> {
  const event = isTxSucceed ? DepositEvent.SEEDED : DepositEvent.SEEDED_FAILED;
  const collectStatus = isTxSucceed ? CollectStatus.COLLECTED : CollectStatus.UNCOLLECTED; // for fee
  const localTxStatus = isTxSucceed ? LocalTxStatus.COMPLETED : LocalTxStatus.FAILED;

  const tasks: Array<Promise<any>> = [
    rawdb.updateLocalTxStatus(manager, localTx.id, localTxStatus, null, fee, blockHeader),
    rawdb.updateWalletBalanceOnlyFee(
      manager,
      localTx,
      collectStatus,
      new BigNumber(localTx.amount),
      WalletEvent.SEED_AMOUNT
    ),
    rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, WalletEvent.SEED_FEE),
    rawdb.updateDepositCollectStatusBySeedTxId(manager, localTx, CollectStatus.UNCOLLECTED, event),
  ];
  await Utils.PromiseAll(tasks);
}
