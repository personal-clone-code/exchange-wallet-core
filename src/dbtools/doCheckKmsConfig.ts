import { EntityManager, getConnection } from 'typeorm';
import { KmsCmk } from '../entities';
import { getLogger } from 'sota-common';
import Kms from '../encrypt/Kms';

const logger = getLogger('DBTools::# KmsCmk::');

export async function doCheckKmsConfig(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckKmsConfig(manager);
  });
}

async function _doCheckKmsConfig(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const kmsErrors: string[] = [];
  const kmscmk = await manager.getRepository(KmsCmk).findOne({
    isEnabled: 1,
  });
  if (!kmscmk) {
    kmsErrors.push(`No KMS CMK in database.`);
  } else {
    try {
      await Kms.getInstance().generateDataKey(kmscmk.id);
    } catch (e) {
      kmsErrors.push(e.toString());
    }
  }
  logger.info(
    `${JSON.stringify({
      isOK: kmsErrors.length === 0,
      totalErrors: kmsErrors.length,
      details: kmsErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
