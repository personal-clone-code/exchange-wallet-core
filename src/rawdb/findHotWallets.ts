import _ from 'lodash';
import { EntityManager, In } from 'typeorm';
import {
  HotWallet,
  Withdrawal,
  RallyWallet,
  ColdWallet,
  Currency,
  LocalTx,
  UserWithdrawalMode,
  Wallet,
} from '../entities';
import { WithdrawalStatus, LocalTxType, LocalTxStatus } from '../Enums';
import { getLogger, BigNumber, ICurrency, GatewayRegistry, HotWalletType } from 'sota-common';

const logger = getLogger('rawdb::findHotWallets');
const DEFAULT_WITHDRAWAL_MODE = 'normal';

/**
 * Get a hot wallet that has no pending transaction
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findSufficientHotWallet(
  manager: EntityManager,
  walletId: number,
  currency: ICurrency,
  amount: BigNumber,
  type: HotWalletType
): Promise<HotWallet> {
  const hotWallets = await findFreeHotWallets(manager, walletId, currency.platform);
  if (!hotWallets.length) {
    return null;
  }

  let foundHotWallet: HotWallet = null;
  const gateway = GatewayRegistry.getGatewayInstance(currency);
  await Promise.all(
    hotWallets.map(async hotWallet => {
      const hotWalletBalance = await gateway.getAddressBalance(hotWallet.address);
      if (hotWallet.type === type && hotWalletBalance.gte(amount)) {
        foundHotWallet = hotWallet;
      }
    })
  );

  if (!foundHotWallet) {
    logger.error(
      `No sufficient hot wallet walletId=${walletId} currency=${currency.symbol} amount=${amount.toString()}`
    );
  }

  return foundHotWallet;
}

/**
 * Find available hot wallet for each currency and its family (same walletId)
 * @param manager
 * @param walletId
 * @param isExternal
 * @private
 */
export async function findFreeHotWallets(
  manager: EntityManager,
  walletId: number,
  currency: string
): Promise<HotWallet[]> {
  // Hot wallet to transfer out money must be internal
  const isExternal = false;

  // Firstly find all hot wallet with given conditions
  const hotWallets = await manager.find(HotWallet, {
    walletId,
    currency,
    isExternal,
  });

  if (!hotWallets.length) {
    return [];
  }

  // Then check whether there're any busy addresses
  const busyAddresses = await getAllBusyHotWallets(manager, walletId);

  // Pick hot wallets that are not busy at the moment
  return hotWallets.filter(hotWallet => !_.includes(busyAddresses, hotWallet.address));
}

/**
 * Get one any hot wallet
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findAnyHotWallet(
  manager: EntityManager,
  walletId: number,
  currency: string,
  isExternal: boolean
): Promise<HotWallet> {
  const hotWallet = await manager.findOne(HotWallet, {
    walletId,
    currency,
    isExternal,
  });
  return hotWallet;
}

export async function findHotWalletByAddress(manager: EntityManager, address: string): Promise<HotWallet> {
  const hotWallet = await manager.findOne(HotWallet, {
    address,
  });
  return hotWallet;
}

export async function findColdWalletByAddress(manager: EntityManager, address: string): Promise<ColdWallet> {
  const wallet = await manager.findOne(ColdWallet, {
    address,
  });
  return wallet;
}

export async function getWithdrawalMode(manager: EntityManager, walletId: number): Promise<string> {
  const wallet = await manager.findOne(Wallet, {
    id: walletId,
  });
  const userWithdrawalMode = await manager.findOne(UserWithdrawalMode, {
    userId: wallet.userId,
  });
  return userWithdrawalMode ? userWithdrawalMode.withdrawalMode : DEFAULT_WITHDRAWAL_MODE;
}

export async function findOneCurrency(manager: EntityManager, symbol: string, walletId: number): Promise<Currency> {
  let currency = await manager.findOne(Currency, {
    symbol,
    walletId,
    withdrawalMode: await getWithdrawalMode(manager, walletId),
  });
  if (!currency) {
    currency = await manager.findOne(Currency, {
      symbol,
      walletId,
      withdrawalMode: DEFAULT_WITHDRAWAL_MODE,
    });
  }
  return currency;
}

export async function findAnyRallyWallet(
  manager: EntityManager,
  walletId: number,
  currency: string
): Promise<RallyWallet> {
  const wallet = await manager.findOne(RallyWallet, { walletId, currency });
  return wallet;
}

export async function findAnyColdWallet(
  manager: EntityManager,
  walletId: number,
  currency: string
): Promise<ColdWallet> {
  const wallet = await manager.findOne(ColdWallet, { walletId, currency });
  return wallet;
}

export async function findAnyInternalHotWallet(manager: EntityManager, walletId: number, currency: string) {
  return findAnyHotWallet(manager, walletId, currency, false);
}

export async function findAnyExternalHotWallet(manager: EntityManager, walletId: number, currency: string) {
  return findAnyHotWallet(manager, walletId, currency, true);
}

/**
 * get pending sender from local_tx
 * @param manager
 * @param walletId
 */
export async function getAllBusyHotWallets(manager: EntityManager, walletId: number): Promise<string[]> {
  const pendingStatuses = [LocalTxStatus.SENT, LocalTxStatus.SIGNED, LocalTxStatus.SIGNING];
  const seedTransactions = await manager.find(LocalTx, {
    walletId,
    type: LocalTxType.SEED,
    status: In(pendingStatuses),
  });

  if (!seedTransactions.length) {
    return [];
  }

  return seedTransactions.map(t => t.fromAddress);
}

/**
 * Get one hot wallet with very specific information: currency and address
 * When using this method, the hot wallet should exist in database
 * If there's no result, it means there's something wrong
 *
 * @param manager
 * @param currency
 * @param address
 */
export async function getOneHotWallet(manager: EntityManager, currency: string, address: string): Promise<HotWallet> {
  const hotWallet = await manager.findOne(HotWallet, { currency, address });
  if (!hotWallet) {
    throw new Error(`Could not get hot wallet with specific information: currency=${currency}, address=${address}`);
  }

  return hotWallet;
}

export async function checkHotWalletIsBusy(
  manager: EntityManager,
  hotWallet: HotWallet,
  pendingStatuses: string[],
  currency: ICurrency
): Promise<boolean> {
  const [pendingTransactions] = await Promise.all([
    manager.find(LocalTx, {
      currency: currency.symbol,
      type: In([LocalTxType.SEED, LocalTxType.WITHDRAWAL_NORMAL, LocalTxType.WITHDRAWAL_COLD]),
      status: In(pendingStatuses),
    }),
  ]);

  if (!pendingTransactions.length) {
    return false;
  }

  return true;
}
