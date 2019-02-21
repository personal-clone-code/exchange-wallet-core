import { EntityManager } from 'typeorm';
import { TransferOutput } from 'sota-common';
import { CurrencyDepositFactory } from '../factories/CurrencyDepositFactory';

/**
 * Persist data to deposit sub table
 *
 * @param {number} depositId
 */
export async function insertDepositSubRecord(
  manager: EntityManager,
  depositId: number,
  output: TransferOutput
): Promise<void> {
  const currency = output.currency;
  const record = CurrencyDepositFactory.create(currency);
  const tx = output.tx;

  Object.assign(record, tx.getExtraDepositData(), { depositId });
  await manager.save(record);
  return;
}
