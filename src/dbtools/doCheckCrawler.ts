import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger } from 'sota-common';

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
  // TODO: implement me.
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
