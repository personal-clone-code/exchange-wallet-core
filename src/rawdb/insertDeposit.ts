import { EntityManager } from 'typeorm';
import { TransferOutput, getLogger, Utils } from 'sota-common';
import * as rawdb from './';
import { Deposit, Address, Wallet, WalletBalance, HotWallet } from '../entities';
import { DepositEvent, WalletEvent, CollectStatus } from '../Enums';
const logger = getLogger('rawdb::insertDeposit');

/**
 * Filter and return only the addresses that we're watching (which are currently stored in address tables)
 *
 * @param {EntityManager} manager - the adapter to database
 * @param {TransferOutput} output - transfer output that is extracted from a transaction
 * @param {boolean} isTxConfirmed - confirmation status of transaction on the blockchain network
 */
export async function insertDeposit(manager: EntityManager, output: TransferOutput): Promise<void> {
  // TODO: We need have a cache mechanism to prevent query flooding
  const address = await manager.getRepository(Address).findOneOrFail({ address: output.toAddress });
  const wallet = await manager.getRepository(Wallet).findOneOrFail(address.walletId);

  // Sanity check. Make sure there's no weird data before persisting it
  _validateWalletDeposit(output, address, wallet);

  const currency = output.currency;
  const subCurrency = output.subCurrency;
  const txid = output.txid;
  const toAddress = output.toAddress;
  const existed = await manager.getRepository(Deposit).count({ currency: subCurrency, txid, toAddress });
  if (existed > 0) {
    logger.warn(`Deposit was recorded already: subCurrency=${subCurrency}, txid=${txid}, address=${toAddress}`);
    return;
  }

  // Create and store deposit record
  const deposit = new Deposit();
  deposit.walletId = wallet.id;
  deposit.typeCurrency = currency;
  deposit.currency = subCurrency;
  deposit.toAddress = toAddress;
  deposit.txid = txid;
  deposit.blockNumber = output.tx.height;
  deposit.blockTimestamp = output.tx.timestamp;
  deposit.amount = output.amount;

  if (deposit.amount.search(/-/g) !== -1) {
    return;
  }

  if (address.isExternal || !(await _checkDepositWithHotWallet(manager, deposit))) {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_EXTERNAL_ADDRESS_OR_HOT_WALLET_ADDRESS';
  }

  // Persist deposit data in main table
  const depositId = (await manager.getRepository(Deposit).save(deposit)).id;

  const walletId = wallet.id;
  const refId = depositId;
  const coin = deposit.currency;

  if (address.isExternal) {
    logger.info(`External Address ${address.address}, Only Webhook`);
    await rawdb.insertDepositLog(manager, depositId, DepositEvent.CREATED, depositId, wallet.userId);
    return;
  }

  const walletBalance = await manager.getRepository(WalletBalance).findOne({ walletId, coin });
  if (!walletBalance) {
    throw new Error(`Wallet balance doesn't exist: walletId=${walletId} coin=${coin}`);
  }

  await Utils.PromiseAll([
    // Update wallet balance
    rawdb.increaseWalletBalance(manager, walletId, coin, output.amount),
    // Record wallet log
    rawdb.insertWalletLog(manager, {
      walletId,
      currency: coin,
      event: WalletEvent.DEPOSIT,
      balanceChange: output.amount,
      refId,
    }),
    // Persist deposit data in sub table
    rawdb.insertDepositSubRecord(manager, depositId, output),
    // Create deposit log and webhook progress
    rawdb.insertDepositLog(manager, depositId, DepositEvent.CREATED, depositId, wallet.userId),
  ]);
}

export default insertDeposit;

// Make sure currency type of address, transaction, transfer out and wallet are matched with others
function _validateWalletDeposit(output: TransferOutput, address: Address, wallet: Wallet): void {
  // TODO: Implement me
  return;
}

async function _checkDepositWithHotWallet(manager: EntityManager, deposit: Deposit): Promise<boolean> {
  const hotWallet = await manager.findOne(HotWallet, {
    address: deposit.toAddress,
  });
  return !hotWallet;
}
