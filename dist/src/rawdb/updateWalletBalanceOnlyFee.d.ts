import { EntityManager } from 'typeorm';
import { CollectStatus, WalletEvent } from '../Enums';
import { WalletBalance, LocalTx } from '../entities';
import { BigNumber } from 'sota-common';
export declare function updateWalletBalanceOnlyFee(manager: EntityManager, transfer: LocalTx, status: CollectStatus, fee: BigNumber, typeFee: WalletEvent): Promise<WalletBalance>;
