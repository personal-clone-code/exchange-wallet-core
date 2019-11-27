import { getConnection, EntityManager } from 'typeorm';
import { KmsDataKey, Address, KmsCmk, HotWallet } from '../../entities';
import { getLogger } from 'sota-common';
import { Kms } from '../../encrypt/Kms';
import * as rawdb from '../../rawdb';
const logger = getLogger('KmsChecking');

export async function checkPrivateKeyIsUnencrypted() {
  await getConnection().transaction(async manager => {
    await _checkPrivateKeyIsUnencrypted(manager);
    // run once time
    // if you want to use with pm2, please disabled below line.
    process.exit(0);
  });
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
  const { listAddresses, listHotWalletAddresses, key } = await getListUnencryptedAddress(manager);

  if (!key) {
    logger.info(`There's no CMK in database...`);
    return;
  }

  if (listAddresses.length) {
    logger.info(
      `List addresses that have unencrypted private key are: ${listAddresses.map(address => address.address)}`
    );
  } else {
    logger.info(`All addresses have encrypted their private key`);
  }

  if (listHotWalletAddresses.length) {
    logger.info(
      `List hot wallet addresses have unencrypted private key: ${listHotWalletAddresses.map(
        address => address.address
      )}`
    );
  } else {
    logger.info(`All hot wallet addresses have encrypted their private key`);
  }

  // run once time
  // if you want to use with pm2, please disabled below line.
  process.exit(0);
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

export async function getListUnencryptedAddress(
  manager: EntityManager
): Promise<{
  listAddresses: Address[];
  listHotWalletAddresses: HotWallet[];
  key: KmsDataKey;
}> {
  const key = await getKmsDataKey(manager);

  if (!key) {
    return {
      listAddresses: [],
      listHotWalletAddresses: [],
      key: null,
    };
  }
  // TODO: if service running with pm2, we shouldn't use them
  // need to difference mechanism
  const [addresses, hotWalletAddresses] = await Promise.all([
    rawdb.getAllAddress(manager),
    rawdb.getAllHotWalletAddress(manager),
  ]);
  const listAddresses = addresses.filter(address => !checkAddress(address.secret));
  const listHotWalletAddresses = hotWalletAddresses.filter(address => !checkAddress(address.secret));
  return {
    listAddresses,
    listHotWalletAddresses,
    key,
  };
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

export async function _fixPrivateKeyIsUnencrypted(manager: EntityManager): Promise<void> {
  const { listAddresses, listHotWalletAddresses, key } = await getListUnencryptedAddress(manager);

  if (!key) {
    logger.info(`There's no CMK in database...`);
    return;
  }

  if (listAddresses.length) {
    const addresses = await Promise.all(
      listAddresses.map(async address => {
        let privateKey = JSON.parse(address.secret);
        if (privateKey.private_key) {
          privateKey = privateKey.private_key;
        }
        address.secret = await encryptPrivateKey(privateKey, key);
        return address;
      })
    );
    await rawdb.updateAddresses(manager, addresses);
  }

  if (listHotWalletAddresses.length) {
    const hotWalletAddresses = await Promise.all(
      listHotWalletAddresses.map(async address => {
        let privateKey = JSON.parse(address.secret);
        if (privateKey.private_key) {
          privateKey = privateKey.private_key;
        }
        address.secret = await encryptPrivateKey(privateKey, key);
        return address;
      })
    );
    await rawdb.updateAllHotWalletAddresses(manager, hotWalletAddresses);
  }

  logger.info(`All hot wallet addresses and addresses have encrypted their private key`);
}

export async function encryptPrivateKey(privateKey: string, dataKey: KmsDataKey): Promise<string> {
  const kms_data_key_id = dataKey.id;
  const private_key = await Kms.getInstance().encrypt(privateKey, kms_data_key_id);
  return JSON.stringify({
    private_key,
    kms_data_key_id,
  });
}
