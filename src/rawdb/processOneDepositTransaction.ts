import { EntityManager, In, Raw, Not } from 'typeorm';
import { getLogger, Utils, BlockchainPlatform, getClient, EnvConfigRegistry } from 'sota-common';
import { BaseCrawler, Transaction } from 'sota-common';
import insertDeposit from './insertDeposit';
import { Address, HotWallet, LocalTx, RallyWallet } from '../entities';
import * as rawdb from '../rawdb';
import _ from 'lodash';
import { WithdrawalMode } from '../Enums';

const logger = getLogger('processOneDepositTransaction');

/**
 * Process one deposit transaction
 */
export async function processOneDepositTransaction(
  manager: EntityManager,
  crawler: BaseCrawler,
  tx: Transaction,
  watchingAddresses: string[]
): Promise<void> {
  // Extract transfer outputs from transaction that we care
  const outputs = tx.extractOutputEntries().filter(output => watchingAddresses.indexOf(output.address) > -1);

  // If there's no output we care, just do nothing
  if (!outputs.length) {
    return;
  }

  // TODO: maybe we still need to call webhook for notifying about transaction that is not confirmed?
  // callWebhookOnce(...);

  // If transaction is not confirmed, also do nothing
  const requiredConfirmations = crawler.getRequiredConfirmations();
  const isTxConfirmed = tx.confirmations >= requiredConfirmations;
  if (!isTxConfirmed) {
    logger.info(`Tx ${tx.txid} doesn't have enough confirmations: ${tx.confirmations}`);
    return;
  }

  // internal tx process
  if (await isInternalTransfer(manager, tx)) {
    logger.info(`Tx ${tx.txid} is a internal tx, will not write to deposit`);
    return;
  }

  await updateAddressBalance(manager, tx);

  await Utils.PromiseAll(outputs.map(async output => insertDeposit(manager, output, tx.extractSenderAddresses())));
}

export async function updateAddressBalance(manager: EntityManager, tx: Transaction) {
  const redisClient = getClient();

  const entries = tx.extractEntries();
  const addresses = await rawdb.findAddresses(manager, entries.map(e => e.address));
  logger.info(`push event redis: EVENT_ADDRESS_BALANCE_CHANGED`);
  await Utils.PromiseAll(
    addresses.map(async address => {
      redisClient.publish(
        EnvConfigRegistry.getAppId(),
        JSON.stringify({
          event: 'EVENT_ADDRESS_BALANCE_CHANGED',
          data: {
            walletId: address.walletId,
            currency: _.find(entries, e => e.address === address.address).currency.symbol,
            address: address.address,
          },
        })
      );
    })
  );
}

/**
 * If a transaction have sender addresses that existed in address table, and hot wallet table
 * so that is internal transfer transaction
 * @param manager
 * @param tx
 */
async function isInternalTransfer(manager: EntityManager, tx: Transaction): Promise<boolean> {
  // Looking for the internal transfer table
  const internalTx = await manager.getRepository(LocalTx).findOne({ txid: tx.txid });
  if (internalTx) {
    return true;
  }

  const senderAddresses: string[] = tx.extractSenderAddresses();
  if (!senderAddresses.length) {
    return false;
  }

  const addressRecord = await manager.getRepository(Address).findOne({ address: In(senderAddresses) });
  if (addressRecord) {
    logger.warn(
      `Tx ${tx.txid} is sent from an internal address sender=${senderAddresses} wallet_id=${addressRecord.walletId}`
    );
    if (!addressRecord.isExternal && addressRecord.secret !== '') {
      logger.error(`Tx ${tx.txid} is sent from an internal address, but it's not in internal transfer table.`);
      return true;
    }
  }

  const hotAddressRecord = await manager.getRepository(HotWallet).findOne({ address: In(senderAddresses) });
  if (hotAddressRecord) {
    logger.error(`Tx ${tx.txid} is sent from an internal hotwallet, but it's not in internal transfer table.`);
    return true;
  }

  return false;
}

export default processOneDepositTransaction;
