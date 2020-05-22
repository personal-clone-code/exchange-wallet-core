import { EntityManager } from 'typeorm';
import { LocalTx } from '../entities';
import { LocalTxType, LocalTxStatus } from '../Enums';
export interface ILocalTxProps {
    readonly fromAddress: string;
    readonly toAddress: string;
    readonly userId: number;
    readonly walletId: number;
    readonly currency: string;
    readonly refCurrency: string;
    readonly amount: string;
    readonly type: LocalTxType;
    readonly refTable: string;
    readonly refId: number;
    readonly memo?: string;
    readonly unsignedRaw: string;
    readonly txid?: string;
    readonly status: LocalTxStatus;
    readonly unsignedTxid: string;
}
export declare function insertLocalTx(manager: EntityManager, localTxProps: ILocalTxProps): Promise<LocalTx>;
