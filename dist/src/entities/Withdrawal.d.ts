import { BigNumber } from 'sota-common';
export declare class Withdrawal {
    id: number;
    userId: number;
    walletId: number;
    currency: string;
    withdrawalTxId: number;
    txid: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    status: string;
    memo: string | null;
    type: string;
    createdAt: number;
    updatedAt: number;
    getAmount(): BigNumber;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
