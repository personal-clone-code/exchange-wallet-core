import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger, Utils } from 'sota-common';
import { Deposit } from '../entities';
import { CollectStatus } from '../Enums';
import { getOverTime } from '.';

const limit = 50;
const logger = getLogger('DBTools::# Crawler::');

export async function doCheckCrawler(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckCrawler(manager);
  });
}

async function _doCheckCrawler(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const crawlerErrors: string[] = [];
  const totalUncompletedDeposits = await manager
    .getRepository(Deposit)
    .createQueryBuilder()
    .where(`collect_status NOT IN ('${CollectStatus.COLLECTED}', '${CollectStatus.NOTCOLLECT}')`)
    .andWhere(`collected_txid NOT IN ('NO_COLLECT_DUST_AMOUNT')`)
    .andWhere(`updated_at < ${Utils.nowInMillis() - 30 * 60 * 60}`)
    .getCount();
  const totalRound = Math.ceil(totalUncompletedDeposits / limit);
  const round = Array.from(Array(totalRound).keys());
  for (const r of round) {
    const unCompletedDeposits: any[] = await manager
      .getRepository(Deposit)
      .createQueryBuilder()
      .where(`collect_status NOT IN ('${CollectStatus.COLLECTED}', '${CollectStatus.NOTCOLLECT}')`)
      .andWhere(`collected_txid NOT IN ('NO_COLLECT_DUST_AMOUNT')`)
      .andWhere(`updated_at < ${Utils.nowInMillis() - 30 * 60 * 60}`)
      .orderBy(`updated_at`, 'ASC')
      .take(limit)
      .skip(r * limit)
      .execute();
    if (!unCompletedDeposits || unCompletedDeposits.length === 0) {
      logger.warn(`There\'re no uncompleted deposits. So, skip round ${r}.`);
      return;
    }
    unCompletedDeposits.map(deposit => {
      const seconds = Math.floor((Utils.nowInMillis() - deposit.Deposit_updated_at) / 1000);
      const overtime = getOverTime(seconds);
      crawlerErrors.push(`Deposit id ${deposit.Deposit_id} in \'${deposit.Deposit_collect_status}\' over ${overtime}.`);
    });
  }
  logger.info(
    `${JSON.stringify({
      isOK: crawlerErrors.length === 0,
      totalErrors: crawlerErrors.length,
      details: crawlerErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
