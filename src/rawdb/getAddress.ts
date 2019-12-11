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
