import { BlockchainPlatform, CurrencyRegistry, getLogger, EnvConfigRegistry } from 'sota-common';
import { getConnection } from 'typeorm';
import { Address } from '../entities';
import * as rawdb from '../rawdb';
import fs from 'fs';

const logger = getLogger('initAddressBalance');

const PAGE_SIZE = 10;
const PAGE_IDX_FILE = `/var/tmp/${EnvConfigRegistry.getAppId()}_initAddressBalance_pageIdx`;
let pageIdx: number = 0;
loadPageIdx();

export default async function initAddressBalance(): Promise<void> {
  const connection = await getConnection();
  const repository = connection.getRepository(Address);
  const addresses = await repository.find({
    order: {
      createdAt: 'ASC',
    },
    skip: pageIdx * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  logger.info(`page: ${pageIdx}, addresses: ${addresses.length}`);
  if (addresses.length <= 0) {
    return;
  }

  const tasks: Array<Promise<void>> = [];
  addresses.map(address => {
    CurrencyRegistry.getCurrenciesOfPlatform(address.currency as BlockchainPlatform).map(currency => {
      logger.info(`add task: ${address.walletId} | ${currency.symbol} | ${address.address}`);
      tasks.push(
        rawdb.updateAddressBalanceFromNetwork(connection.manager, address.walletId, currency.symbol, address.address)
      );
    });
  });
  await Promise.all(tasks);

  pageIdx++;
  savePageIdx();
}

function loadPageIdx() {
  try {
    if (fs.existsSync(PAGE_IDX_FILE)) {
      pageIdx = parseInt(fs.readFileSync(PAGE_IDX_FILE).toString(), 10) || 0;
    }
  } catch (err) {
    logger.error(err);
  }
}

function savePageIdx() {
  try {
    fs.writeFileSync(PAGE_IDX_FILE, pageIdx.toString());
  } catch (err) {
    logger.error(err);
  }
}

export { initAddressBalance };
