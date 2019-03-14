import { EntityManager, In } from 'typeorm';
import { getLogger, Utils } from 'sota-common';
import { BaseCrawler, Transaction } from 'sota-common';
import insertDeposit from './insertDeposit';
import { InternalTransfer } from '../entities/InternalTransfer';
import { InternalTransferType } from '../Enums';

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
  const internalTx = await manager
    .getRepository(InternalTransfer)
    .findOne({ txid: tx.txid, type: In(EnumKeys(InternalTransferType)) });
  if (internalTx) {
    logger.info(`${tx.txid} is a internal tx, not write to deposit`);
    return;
  }

  await Utils.PromiseAll(outputs.map(async output => insertDeposit(manager, output)));
}

/**
 * Helper function: Extract all string keys or value of an enum type
 * enum {A, B} => ['A','B']; enum { ma: 'A', mb: 'B'} => ['A','B']
 * @param value
 * @constructor
 */
function EnumKeys<T>(value: T): string[] {
  const keys: string[] = Object.keys(value).filter(k => {
    return !(parseInt(k, 10) >= 0);
  });
  const valueOfKeys: string[] = [];
  keys.forEach(key => {
    const valueOfKey = (value as any)[key as any];
    const valueOfValueKey = (value as any)[valueOfKey as any];
    const enumValue: string = valueOfKey && key !== valueOfValueKey ? valueOfKey : key;
    valueOfKeys.push(enumValue);
  });
  return valueOfKeys;
}

export default processOneDepositTransaction;
