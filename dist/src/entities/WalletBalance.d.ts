export declare class WalletBalance {
    walletId: number;
    currency: string;
    createdAt: number;
    updatedAt: number;
    balance: string;
    withdrawalPending: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
