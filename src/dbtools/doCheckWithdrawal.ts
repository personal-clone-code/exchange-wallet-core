import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger } from 'sota-common';

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
  // TODO: implement me.
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
