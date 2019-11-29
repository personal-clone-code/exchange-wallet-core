import * as _ from 'lodash';
import { getConnection, EntityManager } from 'typeorm';
import { KmsDataKey, Address, KmsCmk, HotWallet } from '../../entities';
import { getLogger } from 'sota-common';
import { Kms } from '../../encrypt/Kms';
import * as rawdb from '../../rawdb';
const logger = getLogger('KmsChecking');

const limitRecord = 500;

export async function checkPrivateKeyIsUnencrypted() {
  await getConnection().transaction(async manager => {
    await _checkPrivateKeyIsUnencrypted(manager);
  });
  // run once time
  // if you want to use with pm2, please disabled below line.
  process.exit(0);
}

export async function fixPrivateKeyIsUnencrypted() {
  await getConnection().transaction(async manager => {
    await _fixPrivateKeyIsUnencrypted(manager);
  });
  // run once time
  // if you want to use with pm2, please disabled below line.
  process.exit(0);
}

export async function _checkPrivateKeyIsUnencrypted(manager: EntityManager): Promise<void> {
  const key = await getKmsDataKey(manager);
  if (!key) {
    logger.info(`There's no CMK in database...`);
    return;
  }

  const totalAddress = await manager.getRepository(Address).count();
  const totalTask = Math.ceil(totalAddress / limitRecord);
  const round = Array.from(Array(totalTask).keys());
  logger.info(`# Un-encrypted address:`);
  logger.info(`# ====================================`);
  logger.info(`# List addresses that have unencrypted private key are reported below:`);
  for (const r of round) {
    const addresses = await _getUnEncryptedAddresses(manager, r * limitRecord);
    addresses.forEach(address => logger.info(address.address));
  }
  logger.info(`# Un-encrypted hot wallet address:`);
  logger.info(`# ====================================`);
  logger.info(`# List hot wallet addresses that have unencrypted private key are reported below:`);
  const hotWalletAddresses = await _getAllUnEncryptedHotWallets(manager);
  hotWalletAddresses.forEach(address => logger.info(address.address));
  logger.info(`# ====================================`);
  logger.info(`# Finished!`);
  // run once time
  // if you want to use with pm2, please disabled below line.
  process.exit(0);
}

export async function _fixPrivateKeyIsUnencrypted(manager: EntityManager): Promise<void> {
  const key = await getKmsDataKey(manager);
  if (!key) {
    logger.info(`There's no CMK in database...`);
    return;
  }

  const totalAddress = await manager.getRepository(Address).count();
  const totalTask = Math.ceil(totalAddress / limitRecord);
  const round = Array.from(Array(totalTask).keys());
  for (const r of round) {
    const addresses = await _getUnEncryptedAddresses(manager, r * limitRecord);
    const addressTasks = _.map(addresses, async address => {
      let privateKey = JSON.parse(address.secret);
      if (privateKey.private_key) {
        privateKey = privateKey.private_key;
      }
      address.secret = await encryptPrivateKey(privateKey, key);
      return address;
    });
    const addressResults = await Promise.all(addressTasks);
    await rawdb.updateAddresses(manager, addressResults);
  }

  const hotWalletAddresses = await _getAllUnEncryptedHotWallets(manager);
  const hotWalletTasks = _.map(hotWalletAddresses, async address => {
    let privateKey = JSON.parse(address.secret);
    if (privateKey.private_key) {
      privateKey = privateKey.private_key;
    }
    address.secret = await encryptPrivateKey(privateKey, key);
    return address;
  });
  const hotWalletResults = await Promise.all(hotWalletTasks);
  await rawdb.updateAllHotWalletAddresses(manager, hotWalletResults);
  logger.info(`All hot wallet addresses and addresses have encrypted their private key`);
  return;
}

export async function getKmsDataKey(manager: EntityManager): Promise<KmsDataKey> {
  const cmks = await checkExistKms(manager);

  if (!cmks.length) {
    return null;
  }

  const cmk = cmks[0];
  const dataKeys = await manager.getRepository(KmsDataKey).find({ cmkId: cmk.id });
  let key;

  if (!dataKeys.length) {
    logger.info(`There're no data key. Will create a new one...`);
    const rawDataKey = await Kms.getInstance().generateDataKey(cmk.id);
    const dataKeyRecord = new KmsDataKey();
    dataKeyRecord.cmkId = cmk.id;
    dataKeyRecord.encryptedDataKey = rawDataKey.cipher;
    dataKeyRecord.isEnabled = 1;
    const dataKey = await manager.getRepository(KmsDataKey).save(dataKeyRecord);
    logger.info(`Created data key: ${dataKey.encryptedDataKey} (id:${dataKey.id})`);
    key = dataKey;
  } else {
    key = dataKeys[0];
  }
  return key;
}

export async function _getAllUnEncryptedHotWallets(manager: EntityManager): Promise<HotWallet[]> {
  const addresses = await rawdb.getAllHotWalletAddress(manager);
  const unencryptedAddresses = _.filter(addresses, address => !checkAddress(address.secret));
  return unencryptedAddresses;
}

export async function _getUnEncryptedAddresses(manager: EntityManager, offset: number): Promise<Address[]> {
  const addresses = await manager.getRepository(Address).find({
    take: limitRecord,
    skip: offset,
  });
  const unencryptedAddresses = _.filter(addresses, address => !checkAddress(address.secret));
  return unencryptedAddresses;
}

export async function checkExistKms(manager: EntityManager): Promise<KmsCmk[]> {
  const cmks = await manager.getRepository(KmsCmk).find({});
  return cmks;
}

export function checkAddress(privateKey: string): boolean {
  try {
    const secret = JSON.parse(privateKey);
    if (secret.private_key) {
      if (parseInt(secret.kms_data_key_id, 10) > 0) {
        return true;
      }
    } else if (secret.spending_password) {
      if (parseInt(secret.kms_data_key_id, 10) > 0) {
        return true;
      }
    }

    return false;
  } catch (e) {
    return false;
  }
}

export async function encryptPrivateKey(privateKey: string, dataKey: KmsDataKey): Promise<string> {
  const kms_data_key_id = dataKey.id;
  const private_key = await Kms.getInstance().encrypt(privateKey, kms_data_key_id);
  return JSON.stringify({
    private_key,
    kms_data_key_id,
  });
}
