import { EntityManager } from 'typeorm';
import { WalletEvent, DepositEvent } from '../Enums';
import { WalletBalance, Deposit } from '../entities';

import * as rawdb from './index';
import { Utils, Transaction } from 'sota-common';

export async function updateByCollectTransaction(
  manager: EntityManager,
  deposits: Deposit[],
  event: DepositEvent,
  tx: Transaction,
  isExternal: boolean = false
): Promise<WalletBalance> {
  throw new Error(`TODO: Revive me...`);
}
