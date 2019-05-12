import { HotWallet, InternalTransfer, Withdrawal } from '../entities';
import { EntityManager, In } from 'typeorm';
import { InternalTransferType, WithdrawalStatus } from '../Enums';
import { TransferEntry, BaseGateway, getLogger, BigNumber } from 'sota-common';

const logger = getLogger('findAvaiableHotWallet');

/**
 * Get a hot wallet that has no pending transaction
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findTransferableHotWallet(
  manager: EntityManager,
  walletId: number,
  transferEntries: TransferEntry[],
  currency: string,
  isExternal: boolean,
  gateway: BaseGateway
): Promise<HotWallet> {
  let total: BigNumber = new BigNumber(0);
  transferEntries.forEach(entry => {
    total = total.plus(entry.amount);
  });
  let foundHotWallet: HotWallet = null;
  const hotWallets = await _findAvailableHotWallets(manager, walletId, currency, gateway, isExternal);
  if (!hotWallets.length) {
    return foundHotWallet;
  }
  await Promise.all(
    hotWallets.map(async hotWallet => {
      const hotWalletBalance = await gateway.getAddressBalance(hotWallet.address);
      if (hotWalletBalance.gte(total)) {
        foundHotWallet = hotWallet;
        return;
      }
    })
  );
  if (!foundHotWallet) {
    logger.error(
      `Cannot find any hot wallet that have available balance for walletId=${walletId} currency=${currency}`
    );
  }
  return foundHotWallet;
}

/**
 * Find available hot wallet for each currency and its family (same walletId)
 * @param manager
 * @param walletId
 * @param currency
 * @param gateway
 * @param isExternal
 * @private
 */
async function _findAvailableHotWallets(
  manager: EntityManager,
  walletId: number,
  currency: string,
  gateway: BaseGateway,
  isExternal: boolean
): Promise<HotWallet[]> {
  const hotWallets = await manager.find(HotWallet, {
    walletId,
    isExternal,
  });

  if (!hotWallets.length) {
    return [];
  }

  const unavailableHotWallets = await getPendingAdddress(manager, walletId, gateway);
  const availableHotWallets = hotWallets.filter(hotWallet => {
    return unavailableHotWallets.indexOf(hotWallet.address) === -1;
  });

  return availableHotWallets.length > 0 ? availableHotWallets : [];
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

/**
 * get pending addresses from internal transfer and withdrawal tables
 * @param manager
 * @param walletId
 * @param gateway
 */
export async function getPendingAdddress(
  manager: EntityManager,
  walletId: number,
  gateway: BaseGateway
): Promise<string[]> {
  const pendingAddresses: string[] = [];
  const [seedPendingAddresses, wdPendingAddresses] = await Promise.all([
    await _getSeedPendingAddresses(manager, walletId, gateway),
    await _getWithdrawalPendingAddresses(manager, walletId, gateway),
  ]);
  pendingAddresses.push(...seedPendingAddresses);
  pendingAddresses.push(...wdPendingAddresses);
  const uniqueAddresses = Array.from(new Set(pendingAddresses.map((addr: string) => addr)));
  return uniqueAddresses;
}

/**
 * get pending sender from internal transfer
 * @param manager
 * @param walletId
 */
async function _getSeedPendingAddresses(
  manager: EntityManager,
  walletId: number,
  gateway: BaseGateway
): Promise<string[]> {
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  const seedTransactions = await manager.find(InternalTransfer, {
    walletId,
    type: InternalTransferType.SEED,
    status: In(pendingStatuses),
  });
  return [];
  /*
  if (!seedTransactions.length) {
    return [];
  }
  const pendingAddresses: string[] = [];
  await Promise.all(
    seedTransactions.map(async transfer => {
      const tx: Transaction = await gateway.getOneTransaction(transfer.txid);
      pendingAddresses.push(...tx.extractSenderAddresses());
    })
  );
  return pendingAddresses;
  */
}

/**
 * get pending sender from withdrawal
 * @param manager
 * @param walletId
 */
async function _getWithdrawalPendingAddresses(
  manager: EntityManager,
  walletId: number,
  gateway: BaseGateway
): Promise<string[]> {
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  const allPendingWithdrawals = await manager.find(Withdrawal, {
    walletId,
    status: In(pendingStatuses),
  });

  if (!allPendingWithdrawals.length) {
    return [];
  }
  const pendingAddresses: string[] = [];
  await Promise.all(
    allPendingWithdrawals.map(withdrawal => {
      pendingAddresses.push(withdrawal.fromAddress);
    })
  );
  return pendingAddresses;
}
