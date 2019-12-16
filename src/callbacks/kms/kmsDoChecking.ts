import * as _ from 'lodash';
import { getConnection, EntityManager } from 'typeorm';
import { KmsDataKey, Address, KmsCmk, HotWallet, EnvConfig } from '../../entities';
import { getLogger, CurrencyRegistry, EnvConfigRegistry } from 'sota-common';
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

  let unEncryptedAddresses: string[] = [];
  const totalAddress = await manager.getRepository(Address).count();
  const totalTask = Math.ceil(totalAddress / limitRecord);
  const round = Array.from(Array(totalTask).keys());
  for (const r of round) {
    const addresses = await _getUnEncryptedAddresses(manager, r * limitRecord);
    unEncryptedAddresses = _.concat(unEncryptedAddresses, addresses.map(address => address.address));
  }
  logger.info(`# Un-encrypted address:`);
  logger.info(`# ====================================`);
  logger.info(`# List addresses that have unencrypted private key are reported below:`);
  // report all record
  unEncryptedAddresses.map(address => logger.info(address));

  const hotWalletAddresses = await _getAllUnEncryptedHotWallets(manager);
  logger.info(`# Un-encrypted hot wallet address:`);
  logger.info(`# ====================================`);
  logger.info(`# List hot wallet addresses that have unencrypted private key are reported below:`);
  hotWalletAddresses.forEach(address => logger.info(address.address));

  logger.info(`# Un-encrypted sub tables address:`);
  logger.info(`# ====================================`);
  const allCurrencies = CurrencyRegistry.getAllCurrencies();
  const allNativeCurrencies = _.filter(allCurrencies, currency => !!currency.isNative);
  for (const currency of allNativeCurrencies) {
    const subAddresses = await _getUnEncryptedAddressesFromSubTable(manager, currency.symbol);
    if (subAddresses && subAddresses.length !== 0) {
      logger.info(
        `# List addresses in ${currency.symbol}_address that have unencrypted private key are reported below:`
      );
      subAddresses.forEach(address => logger.info(address.address));
    }
  }

  logger.info(`# ====================================`);
  logger.info(`# Finished!`);
  return;
}

async function _getUnEncryptedAddressesFromSubTable(
  manager: EntityManager,
  symbol: string
): Promise<
  Array<{
    address: string;
    privateKey: string;
  }>
> {
  try {
    const existedTable = await manager.query(
      `select * from information_schema.tables where table_schema = ? and table_name = ?`,
      [process.env.TYPEORM_DATABASE, `${symbol.toLowerCase()}_address`]
    );
    if (!existedTable || existedTable.length === 0) {
      logger.debug(`${symbol}_address seems not exitsed.`);
      return [];
    }
  } catch (e) {
    logger.debug(`${symbol}_address seems not exitsed.`);
    return [];
  }
  const unEncryptedAddresses: any[] = await manager
    .createQueryBuilder()
    .select('*')
    .from(`${symbol}_address`, `address`)
    .where(`kms_data_key_id = 0`)
    .execute();
  return _.map(unEncryptedAddresses, address => {
    return {
      address: address.address,
      privateKey: address.private_key,
    };
  });
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
      try {
        let privateKey = JSON.parse(address.secret);
        if (privateKey.private_key) {
          privateKey = privateKey.private_key;
        }
        if (privateKey && privateKey.length !== 0) {
          address.secret = await encryptPrivateKey(privateKey, key);
        }
        return address;
      } catch (e) {
        return null;
      }
    });
    let addressResults = await Promise.all(addressTasks);
    addressResults = _.compact(addressResults);
    await rawdb.updateAddresses(manager, addressResults);
  }

  const hotWalletAddresses = await _getAllUnEncryptedHotWallets(manager);
  const hotWalletTasks = _.map(hotWalletAddresses, async address => {
    try {
      let privateKey = JSON.parse(address.secret);
      if (privateKey.private_key) {
        privateKey = privateKey.private_key;
      }
      if (privateKey && privateKey.length !== 0) {
        address.secret = await encryptPrivateKey(privateKey, key);
      }
      return address;
    } catch (e) {
      return null;
    }
  });
  let hotWalletResults = await Promise.all(hotWalletTasks);
  hotWalletResults = _.compact(hotWalletAddresses);
  await rawdb.updateAllHotWalletAddresses(manager, hotWalletResults);

  const allCurrencies = CurrencyRegistry.getAllCurrencies();
  const allNativeCurrencies = _.filter(allCurrencies, currency => !!currency.isNative);
  for (const currency of allNativeCurrencies) {
    const subAddresses = await _getUnEncryptedAddressesFromSubTable(manager, currency.symbol);
    if (subAddresses && subAddresses.length !== 0) {
      const tasks = _.map(subAddresses, async address => {
        const secret = await Kms.getInstance().encrypt(address.privateKey, key.id);
        await _updatePrivateKeyInSubtable(
          manager,
          `${currency.symbol.toLowerCase()}_address`,
          address.address,
          secret,
          key.id
        );
      });
      await Promise.all(tasks);
    }
  }
  logger.info(`All addresses have encrypted their private key`);
  return;
}

async function _updatePrivateKeyInSubtable(
  manager: EntityManager,
  table: string,
  address: string,
  privateKey: string,
  kmsDataKeyId: number
): Promise<void> {
  await manager.query(`update ${table} set private_key = ?, kms_data_key_id = ? where address = ?`, [
    privateKey,
    kmsDataKeyId,
    address,
  ]);
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
