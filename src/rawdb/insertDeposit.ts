import { EntityManager } from 'typeorm';
import { TransferEntry, getLogger, Utils } from 'sota-common';
import * as rawdb from './';
import { Deposit, Address, Wallet, WalletBalance, HotWallet } from '../entities';
import { DepositEvent, WalletEvent, CollectStatus } from '../Enums';
const logger = getLogger('rawdb::insertDeposit');

/**
 * Filter and return only the addresses that we're watching (which are currently stored in address tables)
 *
 * @param {EntityManager} manager - the adapter to database
 * @param {TransferEntry} output - transfer output that is extracted from a transaction
 * @param {boolean} isTxConfirmed - confirmation status of transaction on the blockchain network
 */
export async function insertDeposit(manager: EntityManager, output: TransferEntry): Promise<void> {
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

  // Create and store deposit record
  const deposit = new Deposit();
  deposit.walletId = wallet.id;
  deposit.currency = currency;
  deposit.toAddress = toAddress;
  deposit.txid = txid;
  deposit.blockNumber = output.tx.height;
  deposit.blockTimestamp = output.tx.timestamp;
  deposit.amount = output.amount.toString();

  if (address.isExternal) {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_EXTERNAL_ADDRESS';
  } else if (await _hasHotWallet(manager, deposit.toAddress)) {
    deposit.collectStatus = CollectStatus.NOTCOLLECT;
    deposit.collectedTxid = 'NO_COLLECT_HOT_WALLET_ADDRESS';
  }

  // Persist deposit data in main table
  const depositId = (await manager.getRepository(Deposit).save(deposit)).id;

  const walletId = wallet.id;
  const refId = depositId;

  if (address.isExternal) {
    logger.info(`External Address ${address.address}, Only Webhook`);
    await rawdb.insertDepositLog(manager, depositId, DepositEvent.CREATED, depositId, wallet.userId);
    return;
  }

  const walletBalance = await manager.getRepository(WalletBalance).findOne({ walletId, currency: deposit.currency });
  if (!walletBalance) {
    throw new Error(`Wallet balance doesn't exist: walletId=${walletId} currency=${deposit.currency}`);
  }

  await Utils.PromiseAll([
    // Update wallet balance
    rawdb.increaseWalletBalance(manager, walletId, deposit.currency, output.amount),
    // Record wallet log
    rawdb.insertWalletLog(manager, {
      walletId,
      currency: deposit.currency,
      event: WalletEvent.DEPOSIT,
      balanceChange: output.amount.toString(),
      refId,
    }),
    // Persist deposit data in sub table
    // rawdb.insertDepositSubRecord(manager, depositId, output),
    // Create deposit log and webhook progress
    rawdb.insertDepositLog(manager, depositId, DepositEvent.CREATED, depositId, wallet.userId),
  ]);
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
