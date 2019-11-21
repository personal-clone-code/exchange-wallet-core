import { Address, Deposit } from '../entities';
import { EntityManager, In } from 'typeorm';
import { CollectStatus } from '../Enums';

export async function findAddresses(manager: EntityManager, addresses: string[]): Promise<Address[]> {
  if (addresses.length === 0) {
    return [];
  }
  return manager.getRepository(Address).find({ address: In(addresses) });
}

export async function checkAddressBusy(manager: EntityManager, address: string): Promise<boolean> {
  const collectingsFromAddress = await manager.getRepository(Deposit).find({
    toAddress: address,
    collectStatus: CollectStatus.COLLECTING,
  });
  return collectingsFromAddress.length > 0;
}
