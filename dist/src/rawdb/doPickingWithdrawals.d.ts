import { EntityManager } from 'typeorm';
import { IRawTransaction } from 'sota-common';
import { HotWallet, LocalTx, Withdrawal, Address } from '../entities';
import { LocalTxType } from '../Enums';
export declare function doPickingWithdrawals(manager: EntityManager, unsignedTx: IRawTransaction, senderWallet: HotWallet | Address, currency: string, withdrawals: Withdrawal[], localTxType?: LocalTxType): Promise<LocalTx>;
export default doPickingWithdrawals;
