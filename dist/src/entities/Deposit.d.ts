export declare class Deposit {
    id: number;
    walletId: number;
    currency: string;
    fromAddress: string;
    toAddress: string;
    txid: string;
    amount: string;
    memo: string | null;
    blockNumber: number;
    blockTimestamp: number;
    collectStatus: string;
    collectedTxid: string;
    collectedTimestamp: number;
    collectLocalTxId: number;
    seededTxid: string;
    seedLocalTxId: number;
    collectWithdrawalId: number;
    collectType: string;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
