import { EntityManager, getConnection } from 'typeorm';
import { KmsDataKey } from '../entities';
import { getLogger } from 'sota-common';
import Kms from '../encrypt/Kms';

const logger = getLogger('DBTools::# KmsDataKey::');

export async function doCheckKmsDataKey(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckKmsDataKey(manager);
  });
}

async function _doCheckKmsDataKey(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const kmsDataKeyErrors: string[] = [];
  const kmsDataKey = await manager.getRepository(KmsDataKey).findOne({
    isEnabled: 1,
  });
  if (!kmsDataKey) {
    kmsDataKeyErrors.push(`No KMS data key in database.`);
  } else {
    const plainText = 'Sotatek@123';
    let cipherText: string;
    try {
      cipherText = await Kms.getInstance().encrypt(plainText, kmsDataKey.id);
    } catch (e) {
      kmsDataKeyErrors.push(e.toString());
    }
    if (cipherText) {
      try {
        const decryptText = await Kms.getInstance().decrypt(plainText, kmsDataKey.id);
        if (decryptText !== plainText) {
          kmsDataKeyErrors.push(`Decrypted data is wrong, plainText=${plainText}, decryptText=${decryptText}`);
        }
      } catch (e) {
        kmsDataKeyErrors.push(e.toString());
      }
    }
  }
  logger.info(
    `${JSON.stringify({
      isOK: kmsDataKeyErrors.length === 0,
      totalErrors: kmsDataKeyErrors.length,
      details: kmsDataKeyErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
