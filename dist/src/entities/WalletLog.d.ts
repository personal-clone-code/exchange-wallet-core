export declare class WalletLog {
    id: number;
    walletId: number;
    currency: string;
    refCurrency: string;
    event: string;
    balanceChange: string;
    data: string;
    refId: number;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
