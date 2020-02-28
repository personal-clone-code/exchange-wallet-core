import { EntityManager } from 'typeorm';
import { Deposit, RallyWallet, Withdrawal } from '../entities';
import { WithdrawalStatus, WithdrawOutType } from '../Enums';
import { handlePendingWithdrawalBalance } from '.';
import { BigNumber, CurrencyRegistry } from 'sota-common';

export async function insertWithdrawals(manager: EntityManager, records: Deposit[], toAddress: string, userId: number) {
  const withdrawals: Withdrawal[] = new Array();
  const tasks: Array<Promise<any>> = [];
  records.forEach(record => {
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
    tasks.push(
      handlePendingWithdrawalBalance(
        manager,
        record.amount,
        record.walletId,
        CurrencyRegistry.getOneCurrency(record.currency)
      )
    );
  });
  tasks.push(manager.getRepository(Withdrawal).save(withdrawals));
  await Promise.all(tasks);
}
