import { HotWallet, Withdrawal } from '../entities';
import { EntityManager, In } from 'typeorm';
import { WithdrawalStatus } from '../Enums';
import { getFamily, TransferOutput, BaseGateway, getLogger } from 'sota-common';
import BigNumber from 'bignumber.js';

const logger = getLogger('findAvaiableHotWallet');
/**
 * Get a hot wallet that has no pending transaction
 *
 * @param manager
 * @param currency
 * @param isExternal
 */
export async function findAvailableHotWallet(
  manager: EntityManager,
  walletId: number,
  currency: string,
  isExternal: boolean
): Promise<HotWallet> {
  const hotWallet = await findAvailableHotWallets(manager, walletId, currency, isExternal);
  return hotWallet.length ? hotWallet[0] : null;
}

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
  transferOutputs: TransferOutput[],
  currency: string,
  isExternal: boolean,
  gateway: BaseGateway
): Promise<HotWallet> {
  let total: BigNumber = new BigNumber('0');
  transferOutputs.forEach(transferOutput => {
    total = total.plus(transferOutput.amount, 10);
  });
  let foundHotWallet: HotWallet = null;
  const hotWallets = await findAvailableHotWallets(manager, walletId, currency, isExternal);
  if (!hotWallets.length) {
    return foundHotWallet;
  }
  await Promise.all(
    hotWallets.map(async hotWallet => {
      const hotWalletBalance: BigNumber = new BigNumber(await gateway.getAddressBalance(hotWallet.address), 10);
      if (hotWalletBalance.isGreaterThan(total)) {
        foundHotWallet = hotWallet;
        return;
      }
    })
  );
  if (!foundHotWallet) {
    logger.error(`Cannot find any hot wallet that have available balance for currency = ${currency.toUpperCase()}`);
  }
  return foundHotWallet;
}

export async function findAvailableHotWallets(
  manager: EntityManager,
  walletId: number,
  currency: string,
  isExternal: boolean
): Promise<HotWallet[]> {
  let hotWallet = await _findAvailableHotWallets(manager, walletId, currency, isExternal);
  if (!hotWallet.length) {
    hotWallet = await _findAvailableHotWallets(manager, walletId, getFamily(), isExternal);
  }
  return hotWallet.length ? hotWallet : [];
}

export async function _findAvailableHotWallets(
  manager: EntityManager,
  walletId: number,
  currency: string,
  isExternal: boolean
): Promise<HotWallet[]> {
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  const hotWallets = await manager.find(HotWallet, {
    walletId,
    currency,
    isExternal,
  });

  if (!hotWallets.length) {
    return [];
  }

  const allHotWalletAddresses = hotWallets.map(h => h.address);
  const allPendingWithdrawals = await manager.find(Withdrawal, {
    fromAddress: In(allHotWalletAddresses),
    status: In(pendingStatuses),
  });

  const unavailableHotWallets = allPendingWithdrawals.map(wd => wd.fromAddress);
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
