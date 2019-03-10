import { HotWallet, Withdrawal } from '../entities';
import { EntityManager, In } from 'typeorm';
import { WithdrawalStatus } from '../Enums';

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
  const pendingStatuses = [WithdrawalStatus.SENT, WithdrawalStatus.SIGNED, WithdrawalStatus.SIGNING];
  const hotWallets = await manager.find(HotWallet, {
    walletId,
    currency,
    isExternal,
  });

  if (!hotWallets.length) {
    return null;
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

  return availableHotWallets.length > 0 ? availableHotWallets[0] : null;
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
