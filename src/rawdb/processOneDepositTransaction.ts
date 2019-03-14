import { EntityManager, In } from 'typeorm';
import { getLogger, Utils } from 'sota-common';
import { BaseCrawler, Transaction } from 'sota-common';
import insertDeposit from './insertDeposit';
import { Address, HotWallet } from '../entities';

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
  const outputs = tx.extractTransferOutputs().filter(output => watchingAddresses.indexOf(output.toAddress) > -1);

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
  if (isInternalTransfer(manager, tx)) {
    logger.info(`${tx.txid} is a internal tx, not write to deposit`);
    return;
  }

  await Utils.PromiseAll(outputs.map(async output => insertDeposit(manager, output)));
}

/**
 * If a transaction have sender addresses that existed in address table, and hot wallet table
 * so that is internal transfer transaction
 * @param manager
 * @param tx
 */
async function isInternalTransfer(manager: EntityManager, tx: Transaction): Promise<boolean> {
  const senderAddresses: string[] = tx.extractSenderAddresses();
  const addressRecord = await manager.getRepository(Address).findOne({ address: In(senderAddresses) });
  if (addressRecord) {
    return true;
  }
  const hotAddressRecord = await manager.getRepository(HotWallet).findOne({ address: In(senderAddresses) });
  return !!hotAddressRecord;
}

export default processOneDepositTransaction;
