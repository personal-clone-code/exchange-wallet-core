import { EntityManager } from 'typeorm';
import { DepositEvent } from '../Enums';
import { WalletBalance, Deposit } from '../entities';
import { Transaction } from 'sota-common';
export declare function updateByCollectTransaction(manager: EntityManager, deposits: Deposit[], event: DepositEvent, tx: Transaction, isExternal?: boolean): Promise<WalletBalance>;
