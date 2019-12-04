import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, Utils } from 'sota-common';
import { Withdrawal } from '../entities';
import { WithdrawalStatus } from '../Enums';
import { getOverTime } from '.';

const limit = 50;
const logger = getLogger('DBTools::# Withdrawal::');

export async function doCheckWithdrawal(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckWithdrawal(manager);
  });
}

async function _doCheckWithdrawal(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const withdrawalErrors: string[] = [];
  const totalUncompletedWithdrawals = await manager
    .getRepository(Withdrawal)
    .createQueryBuilder()
    .where(`status IN ('${WithdrawalStatus.SIGNING}', '${WithdrawalStatus.SIGNED}', '${WithdrawalStatus.SENT}')`)
    .andWhere(`updated_at < ${Utils.nowInMillis() - 30 * 60 * 60}`)
    .getCount();
  const totalRound = Math.ceil(totalUncompletedWithdrawals / limit);
  const round = Array.from(Array(totalRound).keys());
  for (const r of round) {
    const unCompletedWithdrawals: any[] = await manager
      .getRepository(Withdrawal)
      .createQueryBuilder()
      .where(`status IN ('${WithdrawalStatus.SIGNING}', '${WithdrawalStatus.SIGNED}', '${WithdrawalStatus.SENT}')`)
      .andWhere(`updated_at < ${Utils.nowInMillis() - 30 * 60 * 60}`)
      .orderBy(`updated_at`, 'ASC')
      .take(limit)
      .skip(r * limit)
      .execute();
    if (!unCompletedWithdrawals || unCompletedWithdrawals.length === 0) {
      logger.warn(`There\'re no uncompleted withdrawals. So, skip round ${r}.`);
      return;
    }
    unCompletedWithdrawals.map(withdrawal => {
      const seconds = Math.floor((Utils.nowInMillis() - withdrawal.Withdrawal_updated_at) / 1000);
      const overtime = getOverTime(seconds);
      withdrawalErrors.push(
        `Withdrawal id ${withdrawal.Withdrawal_id} in \'${withdrawal.Withdrawal_status}\' over ${overtime}.`
      );
    });
  }
  logger.info(
    `${JSON.stringify({
      isOK: withdrawalErrors.length === 0,
      totalErrors: withdrawalErrors.length,
      details: withdrawalErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
