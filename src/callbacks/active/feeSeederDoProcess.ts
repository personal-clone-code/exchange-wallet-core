import {
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  IRawTransaction,
  GatewayRegistry,
  BitcoinBasedGateway,
  AccountBasedGateway,
  HotWalletType,
  BigNumber,
  SolanaBasedGateway,
  BlockchainPlatform,
} from 'sota-common';
import { EntityManager, getConnection, In, Not } from 'typeorm';
import _ from 'lodash';
import * as rawdb from '../../rawdb';
import { CollectStatus, DepositEvent, LocalTxType, LocalTxStatus, RefTable, WithdrawalStatus } from '../../Enums';
import { Deposit, DepositLog, LocalTx } from '../../entities';

const logger = getLogger('feeSeederDoProcess');

export async function feeSeederDoProcess(seeder: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _feeSeederDoProcess(manager, seeder);
  });
}

async function _feeSeederDoProcess(manager: EntityManager, seeder: BasePlatformWorker): Promise<void> {
  const platformCurrency = seeder.getCurrency();
  const platformCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = platformCurrencies.map(c => c.symbol);

  const seedDeposit = await manager.findOne(Deposit, {
    currency: In(allSymbols),
    collectStatus: CollectStatus.SEED_REQUESTED,
  });

  if (!seedDeposit) {
    logger.info('No deposit need seeding');
    return;
  }
  logger.info(`Found deposit need seeding id=${seedDeposit.id}`);

  const currency = platformCurrency;
  const gateway = GatewayRegistry.getGatewayInstance(currency);
  let seedAmount = await gateway.getAverageSeedingFee();
  if (platformCurrency.platform === BlockchainPlatform.Solana){
    seedAmount = await getAverageSeedingFeeForSolana(manager, seedDeposit)
  } else {
    seedAmount = await gateway.getAverageSeedingFee();
  }
  const hotWallet = await rawdb.findSufficientHotWallet(
    manager,
    seedDeposit.walletId,
    currency,
    seedAmount,
    HotWalletType.Seed
  );

  if (!hotWallet) {
    logger.info(`Hot wallet for seeding depositId=${seedDeposit.id} symbol=${currency.platform} not found`);
    return;
  }
  let rawTx: IRawTransaction;
  try {
    rawTx = currency.isUTXOBased
      ? await (gateway as BitcoinBasedGateway).constructRawTransaction(hotWallet.address, [
          { toAddress: seedDeposit.toAddress, amount: seedAmount },
        ])
      : await (gateway as AccountBasedGateway).constructRawTransaction(
          hotWallet.address,
          seedDeposit.toAddress,
          seedAmount,
          {}
        );
  } catch (err) {
    logger.error(`Cannot create raw transaction, hot wallet balance may be not enough`);
    await rawdb.updateRecordsTimestamp(manager, Deposit, [seedDeposit.id]);
    throw err;
  }

  if (!rawTx) {
    throw new Error('rawTx is undefined because of unknown problem');
  }

  const localTx = await rawdb.insertLocalTx(manager, {
    fromAddress: hotWallet.address,
    toAddress: seedDeposit.toAddress,
    userId: hotWallet.userId,
    walletId: hotWallet.walletId,
    currency: currency.symbol,
    refCurrency: seedDeposit.currency,
    refId: 0,
    refTable: RefTable.DEPOSIT,
    type: LocalTxType.SEED,
    status: LocalTxStatus.SIGNING,
    unsignedRaw: rawTx.unsignedRaw,
    unsignedTxid: rawTx.txid,
    amount: seedAmount.toString(),
  });

  await manager.update(Deposit, seedDeposit.id, {
    updatedAt: Utils.nowInMillis(),
    seedLocalTxId: localTx.id,
    collectStatus: CollectStatus.SEEDING,
  });

  await manager.insert(DepositLog, {
    depositId: seedDeposit.id,
    event: DepositEvent.SEEDING,
    refId: seedDeposit.id,
    data: rawTx.txid,
    createdAt: Utils.nowInMillis(),
  });

  logger.info(`Seed queued address=${seedDeposit.toAddress}`);
}

async function getAverageSeedingFeeForSolana(manager: EntityManager, deposit: Deposit): Promise<BigNumber> {
  let rallyWallet = null;
  const { walletId, currency} = deposit;

  const iCurrency = CurrencyRegistry.getOneCurrency(currency);
  if (iCurrency.symbol) {
    rallyWallet = await rawdb.findAnyRallyWallet(manager, walletId, iCurrency.symbol);
  }

  if (!rallyWallet) {
    rallyWallet = await rawdb.findAnyRallyWallet(manager, walletId, iCurrency.platform);
  }

  if (!rallyWallet) {
    throw new Error(`Rally wallet for wallet=${walletId} symbol=${iCurrency.symbol} and platform=${iCurrency.platform} not found`);
  }
 
  //In Solana, accounts which maintain a minimum balance equivalent to 2 years of rent payments are exempt
  //We will maintain minimum balance on deposit address
  const withdrawalStatuses = [WithdrawalStatus.UNSIGNED, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING, WithdrawalStatus.SENT, WithdrawalStatus.COMPLETED];
  const platformCurrencyCollected = await rawdb.hasAnyCollectFromAddressToAddress(manager, iCurrency.platform, withdrawalStatuses, rallyWallet.address, deposit.toAddress);
  const seedRecord = await rawdb.seedRecordToAddressIsExist(manager, deposit.toAddress);
  let seedAmount = new BigNumber(0);
  if (!platformCurrencyCollected && !seedRecord){
    seedAmount = await (GatewayRegistry.getGatewayInstance(iCurrency.platform) as SolanaBasedGateway).getMinimumBalanceForRentExemption();
  }
  const currencyCollected = await rawdb.hasAnyCollectFromAddressToAddress(manager, iCurrency.symbol, withdrawalStatuses, rallyWallet.address);
  seedAmount = seedAmount.plus(await (GatewayRegistry.getGatewayInstance(iCurrency) as SolanaBasedGateway).getAverageSeedingFee(!currencyCollected));
  return seedAmount;
}