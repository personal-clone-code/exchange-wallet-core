import { Address, Deposit } from '../entities';
import { EntityManager, In } from 'typeorm';
import { CollectStatus } from '../Enums';

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
