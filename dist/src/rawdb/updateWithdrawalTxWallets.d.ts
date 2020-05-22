import { BigNumber } from 'sota-common';
import { EntityManager } from 'typeorm';
import { WithdrawalEvent } from '../Enums';
import { WalletBalance, LocalTx } from '../entities';
export declare function updateWithdrawalTxWallets(manager: EntityManager, localTx: LocalTx, event: WithdrawalEvent.COMPLETED | WithdrawalEvent.FAILED, fee: BigNumber): Promise<WalletBalance>;
