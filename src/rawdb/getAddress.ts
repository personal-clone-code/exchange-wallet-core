import { EntityManager } from 'typeorm';
import { Address, HotWallet } from '../entities';

export async function getAllAddress(manager: EntityManager) {
  return await manager.getRepository(Address).find({});
}

export async function getAllHotWalletAddress(manager: EntityManager) {
  return await manager.getRepository(HotWallet).find({});
}

export async function updateAddresses(manager: EntityManager, addresses: Address[]) {
  const tasks = addresses.map(async address => {
    await manager.update(Address, address.address, { secret: address.secret });
  });
  await Promise.all(tasks);
}

export async function updateAllHotWalletAddresses(manager: EntityManager, addresses: HotWallet[]) {
  const tasks = addresses.map(async address => {
    await manager.update(HotWallet, address.address, { secret: address.secret });
  });
  await Promise.all(tasks);
}

export async function getOneAddress(manager: EntityManager, currency: string, address: string): Promise<Address> {
  const hotWallet = await manager.findOne(Address, { currency, address });
  if (!hotWallet) {
    throw new Error(`Could not get address with specific information: currency=${currency}, address=${address}`);
  }

  return hotWallet;
}