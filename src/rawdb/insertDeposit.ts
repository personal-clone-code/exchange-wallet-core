import { EntityManager } from 'typeorm';
import { TransferEntry, getLogger, Utils, CurrencyRegistry, BigNumber, BlockchainPlatform } from 'sota-common';
import * as rawdb from './';
import { Deposit, Address, Wallet, WalletBalance, WalletLog, HotWallet } from '../entities';
import { DepositEvent, WalletEvent, CollectStatus } from '../Enums';
const logger = getLogger('rawdb::insertDeposit');

/**
 * Filter and return only the addresses that we're watching (which are currently stored in address tables)
 *
 * @param {EntityManager} manager - the adapter to database
 * @param {TransferEntry} output - transfer output that is extracted from a transaction
 * @param {boolean} isTxConfirmed - confirmation status of transaction on the blockchain network
 */
export async function insertDeposit(
  manager: EntityManager,
  output: TransferEntry,
  senderAddresses: string[]
): Promise<void> {
  // TODO: We need have a cache mechanism to prevent query flooding
  const address = await manager.getRepository(Address).findOneOrFail({ address: output.address });
  const wallet = await manager.getRepository(Wallet).findOneOrFail(address.walletId);

  // Sanity check. Make sure there's no weird data before persisting it
  _validateWalletDeposit(output, address, wallet);

  const currency = output.currency.symbol;
  const txid = output.txid;
  const toAddress = output.address;
  const existed = await manager.getRepository(Deposit).count({ currency, txid, toAddress });
  if (existed > 0) {
    logger.info(`Deposit was recorded already: currency=${currency}, txid=${txid}, address=${toAddress}`);
    return;
  }

  if (output.amount.lte(0)) {
    return;
  }

  const currencyInfo = CurrencyRegistry.getOneCurrency(currency);
  const amount = output.amount.toFixed(currencyInfo.nativeScale);

  // Create and store deposit record
  const deposit = new Deposit();
  deposit.walletId = wallet.id;
  deposit.currency = currency;
  deposit.fromAddress = JSON.stringify(senderAddresses);
  deposit.toAddress = toAddress;
  deposit.txid = txid;
  deposit.blockNumber = output.tx.height;
  deposit.blockTimestamp = output.tx.timestamp;
  deposit.amount = amount;

  const currencyThreshold = await rawdb.findOneCurrency(manager, deposit.currency, deposit.walletId);
  let minimumCollectAmount = new BigNumber(0);
  if (currencyThreshold && currencyThreshold.minimumCollectAmount) {
    minimumCollectAmount = new BigNumber(currencyThreshold.minimumCollectAmount);
  }

  if (address.isExternal) {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_EXTERNAL_ADDRESS';
  } else if (await _hasHotWallet(manager, deposit.toAddress)) {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_HOT_WALLET_ADDRESS';
  } else if (new BigNumber(deposit.amount).lt(minimumCollectAmount)) {
    // deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_DUST_AMOUNT';
  }

  // Persist deposit data in main table
  const depositId = (await manager.getRepository(Deposit).save(deposit)).id;
  await rawdb.insertDepositLog(manager, depositId, DepositEvent.CREATED, depositId, wallet.userId);
  return;
}

export default insertDeposit;

// Make sure currency type of address, transaction, transfer out and wallet are matched with others
function _validateWalletDeposit(output: TransferEntry, address: Address, wallet: Wallet): void {
  // TODO: Implement me
  return;
}

async function _hasHotWallet(manager: EntityManager, address: string): Promise<boolean> {
  const hotWallet = await manager.findOne(HotWallet, { address });
  return !!hotWallet;
}
