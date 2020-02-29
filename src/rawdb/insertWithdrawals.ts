import { EntityManager } from 'typeorm';
import { Deposit, RallyWallet, Withdrawal } from '../entities';
import { WithdrawalStatus, WithdrawOutType } from '../Enums';
import { handlePendingWithdrawalBalance } from '.';
import { BigNumber, CurrencyRegistry } from 'sota-common';

export async function insertWithdrawals(
  manager: EntityManager,
  records: Deposit[],
  toAddress: string,
  userId: number
): Promise<Map<number, number>> {
  if (!records.length) {
    return null;
  }
  const withdrawals: Withdrawal[] = new Array();
  const tasks: Array<Promise<any>> = [];
  const pairs: Map<number, number> = new Map();
  tasks.push(
    ...records.map(async record => {
      const withdrawal = new Withdrawal();
      withdrawal.currency = record.currency;
      withdrawal.fromAddress = record.toAddress;
      withdrawal.memo = 'FROM_MACHINE';
      withdrawal.amount = record.amount;
      withdrawal.userId = userId;
      withdrawal.type = WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS;
      withdrawal.walletId = record.walletId;
      withdrawal.toAddress = toAddress;
      withdrawal.status = WithdrawalStatus.UNSIGNED;
      withdrawals.push(withdrawal);
      const withdrawalId = await saveAndGetPair(manager, withdrawal);
      pairs.set(record.id, withdrawalId);
    })
  );

  const amount = records.reduce((memo, deposit) => {
    return memo.plus(new BigNumber(deposit.amount));
  }, new BigNumber(0));
  tasks.push(
    handlePendingWithdrawalBalance(
      manager,
      amount.toString(),
      records[0].walletId,
      CurrencyRegistry.getOneCurrency(records[0].currency)
    )
  );
  tasks.push(manager.getRepository(Withdrawal).save(withdrawals));
  await Promise.all(tasks);
  return pairs;
}

async function saveAndGetPair(manager: EntityManager, withdrawal: Withdrawal) {
  return (await manager.getRepository(Withdrawal).save(withdrawal)).id;
}
