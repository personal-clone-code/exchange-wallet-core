import {
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  IRawTransaction,
  GatewayRegistry,
  BitcoinBasedGateway,
  AccountBasedGateway,
  BigNumber,
  IBoiledVOut,
  IInsightUtxoInfo,
  ISignedRawTransaction,
  ICurrency,
  UTXOBasedGateway,
  BlockchainPlatform,
  SolanaBasedGateway,
} from 'sota-common';
import _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { CollectStatus, LocalTxType, RefTable, LocalTxStatus, CollectType, DepositEvent, WithdrawalStatus } from '../../Enums';
import { Deposit } from '../../entities';

const logger = getLogger('collectorDoProcess');

export async function collectorDoProcess(collector: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _collectorDoProcess(manager, collector);
  });
}

/**
 * Tasks of collector:
 * - Find uncollected deposits
 *   + If the deposit currency is account-based, just take 1 record
 *   + If the deposit currency is utxo-based, take multiple records
 * - If the deposit amount is too small, just skip. We'll wait until the funds is big enough
 * - Find an internal hot wallet
 * - Send fee to deposit address if needed to collect tokens (ERC20, USDT, ...)
 * - Make transaction that transfer funds from deposit addresses to the hot wallet
 *
 * @param manager
 * @param picker
 * @private
 */
async function _collectorDoProcess(manager: EntityManager, collector: BasePlatformWorker): Promise<void> {
  const platformCurrency = collector.getCurrency();
  const platformCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = platformCurrencies.map(c => c.symbol);

  const { walletId, currency, records, amount } = await rawdb.findOneGroupOfCollectableDeposits(manager, allSymbols);

  if (!walletId || !currency || !records.length || amount.isZero()) {
    logger.info(`There're no uncollected deposit right now. Will try to process later...`);
    return;
  }

  //In Solana, accounts which maintain a minimum balance equivalent to 2 years of rent payments are exempt
  //we will maintain a minimum balance to get free rent
  if (currency.symbol === CurrencyRegistry.Solana.symbol){
    const gateway = GatewayRegistry.getGatewayInstance(currency) as SolanaBasedGateway;
    const balance = await gateway.getAddressBalance(records[0].toAddress);
    const minimumBalance = await gateway.getMinimumBalanceForRentExemption();
    if (balance.minus(minimumBalance).lte(0)){
      logger.info(`${currency.symbol} does not have a enough collect amount, minimumBalance=${minimumBalance}, totalAmount=${amount}. Will try to process later...`);
      return;
    }
  }

  let rallyWallet = null;
  if (currency.symbol) {
    rallyWallet = await rawdb.findAnyRallyWallet(manager, walletId, currency.symbol);
  }

  if (!rallyWallet) {
    rallyWallet = await rawdb.findAnyRallyWallet(manager, walletId, currency.platform);
  }

  if (!rallyWallet && currency.family) {
    rallyWallet = await rawdb.findAnyRallyWallet(manager, walletId, currency.family);
  }

  if (!rallyWallet) {
    throw new Error(`Rally wallet for symbol=${currency.symbol} and platform=${currency.platform} not found`);
  }

  let rawTx: IRawTransaction;
  try {
    // check balance in network to prevent misseeding error
    if (!currency.isNative) {
      const gateway = await GatewayRegistry.getGatewayInstance(currency.platform);
      let minAmount = new BigNumber(0);
      const currencyConfig = await rawdb.findOneCurrency(manager, currency.platform, walletId);
      if (currencyConfig && currencyConfig.minimumCollectAmount) {
        minAmount = new BigNumber(currencyConfig.minimumCollectAmount);
      } else {     
        //In Solana, accounts which maintain a minimum balance equivalent to 2 years of rent payments are exempt
        //we will maintain a minimum balance = solana_account_cost on rally_wallet to get free rental
        //so the maximum balance of a seeded address may be equal to = solana_account_cost + token_account_cost + 3 * transaction fee
        if (currency.platform === BlockchainPlatform.Solana){
          minAmount = new BigNumber(await (gateway as SolanaBasedGateway).getMinimumBalanceForRentExemption());
          const withdrawalStatuses = [WithdrawalStatus.UNSIGNED, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING, WithdrawalStatus.SENT, WithdrawalStatus.COMPLETED];
          if (!(await rawdb.hasAnyCollectFromAddressToAddress(manager, currency.symbol, withdrawalStatuses, rallyWallet.addresss, records[0].toAddress))){
            const tokenGateway = GatewayRegistry.getGatewayInstance(currency.symbol) as SolanaBasedGateway;
            minAmount = minAmount.plus((await tokenGateway.getMinimumBalanceForRentExemption()).plus((await gateway.getAverageSeedingFee()).multipliedBy(new BigNumber(3))));
          }
        } else {
          minAmount = minAmount.plus((await gateway.getAverageSeedingFee()).multipliedBy(new BigNumber(3)));
        }
      }
      // if (records.length > 1) {
      //   throw new Error('multiple tx seeding is not supported now');
      // }
      const record = records[0];
      const balance = await gateway.getAddressBalance(record.toAddress);
      if (balance.gte(minAmount)) {
        logger.error(`deposit id=${record.id} is pending, if it last for long, collect manually`);
        manager.update(Deposit, record.id, {
          updatedAt: Utils.nowInMillis() + 3 * 60 * 1000, // 3 minutes
        });
        return;
      }
    }

    rawTx = currency.platform === BlockchainPlatform.Solana ? await _constructSolanaBasedCollectTx(records, rallyWallet.address, amount) : (currency.isUTXOBased
      ? await _constructUtxoBasedCollectTx(records, rallyWallet.address)
      : await _constructAccountBasedCollectTx(records, rallyWallet.address));
  } catch (err) {
    if (currency.platform === BlockchainPlatform.Solana && !err.toString().includes('has insufficient funds for fee')){
      throw err
    }
    logger.error(`Cannot create raw transaction, may need fee seeder err=${err}`);
    await rawdb.updateRecordsTimestamp(manager, Deposit, records.map(r => r.id));
    if (!currency.isNative) {
      const record = records[0];
      const seedRequested = await rawdb.hasAnySeedRequestedToAddress(manager, record.toAddress);
      if (!!seedRequested) {
        logger.warn(
          `Address ${record.toAddress} has seed requested or seeding. So, don\'t need more seed requests at this time.`
        );
        return;
      }
      record.collectStatus = CollectStatus.SEED_REQUESTED;
      await manager.save(record);
    }
    return;
  }

  if (!rawTx) {
    throw new Error('rawTx is undefined because of unknown problem');
  }

  if (await rawdb.isExternalAddress(manager, rallyWallet.address)) {
    logger.info(`${rallyWallet.address} is external, create withdrawal record to withdraw out`);
    const pairs = (currency.isUTXOBased && currency.platform !== BlockchainPlatform.NEO) ? await rawdb.insertWithdrawals(manager, records, rallyWallet.address, rallyWallet.userId) : await rawdb.insertWithdrawal(manager, records, rallyWallet.address, rallyWallet.userId, amount);
    await Promise.all(
      records.map(async r => {
        return Promise.all([
          manager.update(Deposit, r.id, {
            updatedAt: Utils.nowInMillis(),
            collectStatus: CollectStatus.COLLECTING,
            collectWithdrawalId: pairs.get(r.id),
            collectType: CollectType.WITHDRAWAL,
          }),
        ]);
      })
    );
    logger.info(`Collect tx queued: address=${rallyWallet.address}, withdrawals=${records.map(r => r.id)}`);
    return;
  }

  const localTx = await rawdb.insertLocalTx(manager, {
    fromAddress: 'FIND_IN_DEPOSIT',
    toAddress: rallyWallet.address,
    userId: rallyWallet.userId,
    walletId: rallyWallet.walletId,
    currency: currency.symbol,
    refCurrency: records[0].currency,
    refId: 0,
    refTable: RefTable.DEPOSIT,
    type: LocalTxType.COLLECT,
    status: LocalTxStatus.SIGNING,
    unsignedRaw: rawTx.unsignedRaw,
    unsignedTxid: rawTx.txid,
    amount: amount.toString(),
  });

  await manager.update(Deposit, records.map(r => r.id), {
    updatedAt: Utils.nowInMillis(),
    collectLocalTxId: localTx.id,
    collectStatus: CollectStatus.COLLECTING,
  });

  logger.info(`Collect tx queued: address=${rallyWallet.address}, txid=${rawTx.txid}, localTxId=${localTx.id}`);
}

/**
 * construct utxo collect tx
 * @param deposits
 * @param toAddress
 */
export async function _constructUtxoBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as UTXOBasedGateway;
  const utxos: IInsightUtxoInfo[] = [];
  const weirdVouts: IBoiledVOut[] = [];
  const depositAddresses: string[] = [];
  await Utils.PromiseAll(
    deposits.map(async deposit => {
      const depositAddress = deposit.toAddress;
      const txid = deposit.txid;
      if (depositAddresses.indexOf(depositAddress) === -1) {
        depositAddresses.push(depositAddress);
      }

      const depositVouts = await gateway.getOneTxVouts(deposit.txid, depositAddress);
      const allAddressUtxos = await gateway.getOneAddressUtxos(depositAddress);
      depositVouts.forEach(vout => {
        // Something went wrong. This output has been spent.
        if (vout.spentTxId) {
          weirdVouts.push(vout);
          return;
        }

        const utxo = allAddressUtxos.find(u => {
          return u.txid === txid && u.address === depositAddress && u.vout === vout.n;
        });

        // Double check. Something went wrong here as well. The output has been spent.
        if (!utxo) {
          logger.error(`Output has been spent already: address=${depositAddress}, txid=${txid}, n=${vout.n}`);
          return;
        }

        utxos.push(utxo);
      });
    })
  );

  // Safety check, just in case
  if (weirdVouts.length > 0) {
    throw new Error(`Weird outputs were spent without collecting: ${JSON.stringify(weirdVouts)}`);
  }

  // Final check. Guarding one more time, whether total value from utxos is equal to deposits' value
  const depositAmount = deposits.reduce((memo, d) => memo.plus(new BigNumber(d.amount)), new BigNumber(0));
  const utxoAmount = utxos.reduce((memo, u) => memo.plus(new BigNumber(u.satoshis || 0)), new BigNumber(0));

  if (!depositAmount.eq(utxoAmount)) {
    throw new Error(`Mismatch collecting values: depositAmount=${depositAmount}, utxoAmount=${utxoAmount}`);
  }

  return gateway.constructRawConsolidateTransaction(utxos, toAddress);
}

async function _constructAccountBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as AccountBasedGateway;
  const amount = deposits.reduce((memo, deposit) => {
    return memo.plus(new BigNumber(deposit.amount));
  }, new BigNumber(0));

  return gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount, {
    isConsolidate: currency.isNative,
    useLowerNetworkFee: true,
  });
}

async function _constructSolanaBasedCollectTx(deposits: Deposit[], toAddress: string, amount: BigNumber): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as SolanaBasedGateway;
 
  return gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount, {
    isConsolidate: currency.isNative,
    needFunding: !currency.isNative,
    maintainRent: true,
  });
}