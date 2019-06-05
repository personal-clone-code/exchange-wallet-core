import {
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  IRawTransaction,
  GatewayRegistry,
  BitcoinBasedGateway,
  AccountBasedGateway,
} from 'sota-common';
import { EntityManager, getConnection, In } from 'typeorm';
import _ from 'lodash';
import * as rawdb from '../../rawdb';
import { CollectStatus, InternalTransferType, WithdrawalStatus, DepositEvent } from '../../Enums';
import { Deposit, InternalTransfer, DepositLog } from '../../entities';

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

  let deposits = await manager.find(Deposit, {
    collectStatus: CollectStatus.UNCOLLECTED,
    currency: In(allSymbols),
  });
  deposits = await Utils.PromiseAll(
    deposits.map(async deposit => {
      if (CurrencyRegistry.getOneCurrency(deposit.currency).isNative) {
        return null;
      }
      const seeding = await manager.findOne(DepositLog, {
        depositId: deposit.id,
        event: DepositEvent.SEEDING,
      });
      if (seeding) {
        return null;
      }
      return deposit;
    })
  );
  deposits = deposits.filter(deposit => !_.isNil(deposit));

  if (deposits.length === 0) {
    logger.info('No deposit need seeding');
    return;
  }

  const seedDeposit = deposits[0];
  const currency = platformCurrency;
  logger.info(`Found deposit need seeding id=${seedDeposit.id}`);

  const hotWallet = await rawdb.findAnyInternalHotWallet(manager, seedDeposit.walletId, currency.platform);

  if (!hotWallet) {
    throw new Error(`Hot wallet for symbol=${currency.platform} not found`);
  }

  const gateway = GatewayRegistry.getGatewayInstance(currency);
  const seedAmount = await gateway.getAverageSeedingFee();
  let rawTx: IRawTransaction;
  try {
    rawTx = currency.isUTXOBased
      ? await (gateway as BitcoinBasedGateway).constructRawTransaction(hotWallet.address, [
          { toAddress: seedDeposit.toAddress, amount: seedAmount },
        ])
      : await (gateway as AccountBasedGateway).constructRawTransaction(
          hotWallet.address,
          seedDeposit.toAddress,
          seedAmount
        );
  } catch (err) {
    logger.error(`Cannot create raw transaction, hot wallet balance may be not enough`);
    await rawdb.updateRecordsTimestamp(manager, Deposit, [seedDeposit.id]);
    throw err;
  }

  if (!rawTx) {
    throw new Error('rawTx is undefined because of unknown problem');
  }

  const signedTx = await gateway.signRawTransaction(rawTx.unsignedRaw, await hotWallet.extractRawPrivateKey());
  try {
    await gateway.sendRawTransaction(signedTx.signedRaw);
  } catch (e) {
    logger.error(`Can not send transaction txid=${signedTx.txid}`);
    throw e;
  }

  // create internal
  const internalTransferRecord = new InternalTransfer();
  internalTransferRecord.currency = currency.platform;
  internalTransferRecord.walletId = hotWallet.walletId;
  internalTransferRecord.fromAddress = 'will remove this field'; // remove
  internalTransferRecord.toAddress = 'will remove this field'; // remove
  internalTransferRecord.type = InternalTransferType.SEED;
  internalTransferRecord.txid = signedTx.txid;
  internalTransferRecord.status = WithdrawalStatus.SENT;
  internalTransferRecord.amount = seedAmount.toString();
  internalTransferRecord.feeCurrency = currency.platform;

  await Utils.PromiseAll([
    rawdb.insertInternalTransfer(manager, internalTransferRecord),
    manager.insert(DepositLog, {
      depositId: seedDeposit.id,
      event: DepositEvent.SEEDING,
      refId: seedDeposit.id,
      data: signedTx.txid,
    }),
  ]);

  logger.info(`Seed Successfully address=${seedDeposit.toAddress}`);
}
