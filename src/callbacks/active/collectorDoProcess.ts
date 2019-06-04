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
} from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { CollectStatus } from '../../Enums';
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

  const { walletId, currency, records } = await rawdb.findOneGroupOfCollectableDeposits(manager, allSymbols);

  if (!walletId || !currency || !records.length) {
    logger.info(`There're no uncollected deposit right now. Will try to process later...`);
    return;
  }

  const hotWallet = await rawdb.findAnyInternalHotWallet(manager, walletId, currency.symbol);
  const rawTx: IRawTransaction = currency.isUTXOBased
    ? await _constructUtxoBasedCollectTx(records, hotWallet.address)
    : await _constructAccountBasedCollectTx(records, hotWallet.address);

  const now = Utils.nowInMillis();
  await manager.update(Deposit, records.map(r => r.id), {
    updatedAt: now,
    collectedTxid: rawTx.txid,
    collectStatus: CollectStatus.COLLECTING,
  });
}

async function _constructUtxoBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as BitcoinBasedGateway;
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
  const utxoAmount = utxos.reduce((memo, u) => memo.plus(new BigNumber(u.satoshis)), new BigNumber(0));

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

  return gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount);
}
