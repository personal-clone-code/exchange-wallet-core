import { GatewayRegistry, getLogger } from 'sota-common';
import { EntityManager } from 'typeorm';
import { AddressBalance } from '../entities';

const logger = getLogger('updateAddressBalanceFromNetwork');

export async function updateAddressBalanceFromNetwork(
  manager: EntityManager,
  walletId: number,
  currency: string,
  address: string
): Promise<void> {
  const gateway = GatewayRegistry.getGatewayInstance(currency);
  let balance;
  try {
    balance = await gateway.getAddressBalance(address);
  } catch (err) {
    logger.error(err);
    return;
  }

  let addressBalance = await manager.findOne(AddressBalance, {
    walletId,
    currency,
    address,
  });

  if (!addressBalance) {
    if (balance.lte(0)) {
      return;
    }
    addressBalance = new AddressBalance();
    addressBalance.walletId = walletId;
    addressBalance.currency = currency;
    addressBalance.address = address;
  }
  addressBalance.balance = balance.toString();
  await manager.save(addressBalance);
}
