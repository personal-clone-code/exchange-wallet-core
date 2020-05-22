export declare class WithdrawalTx {
    id: number;
    userId: number;
    walletId: number;
    hotWalletAddress: string;
    txid: string | null;
    status: string;
    currency: string;
    unsignedTxid: string;
    unsignedRaw: string | null;
    signedRaw: string | null;
    blockNumber: number;
    blockHash: string;
    blockTimestamp: number;
    feeAmount: string;
    feeCurrency: string;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
