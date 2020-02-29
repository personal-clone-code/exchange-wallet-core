import { Address, Deposit, LocalTx } from '../entities';
import { EntityManager, In } from 'typeorm';
import { CollectStatus, LocalTxType } from '../Enums';

export async function findAddresses(manager: EntityManager, addresses: string[]): Promise<Address[]> {
  if (addresses.length === 0) {
    return [];
  }
  return manager.getRepository(Address).find({ address: In(addresses) });
}

export async function findAddress(manager: EntityManager, address: string): Promise<Address> {
  return manager.getRepository(Address).findOne({ address });
}

export async function checkAddressBusy(manager: EntityManager, address: string): Promise<boolean> {
  const collectingsFromAddress = await manager.getRepository(Deposit).find({
    toAddress: address,
    collectStatus: In([CollectStatus.COLLECT_SIGNED, CollectStatus.COLLECT_SENT]),
  });
  return collectingsFromAddress.length > 0;
}

export async function checkAddressIsBusy(
  manager: EntityManager,
  hotWallet: Address,
  pendingStatuses: string[],
  platform: string
): Promise<boolean> {
  const [pendingTransactions] = await Promise.all([
    manager.find(LocalTx, {
      fromAddress: hotWallet.address,
      currency: platform,
      type: In([LocalTxType.WITHDRAWAL_COLLECT]),
      status: In(pendingStatuses),
    }),
  ]);

  if (!pendingTransactions.length) {
    return false;
  }

  return true;
}