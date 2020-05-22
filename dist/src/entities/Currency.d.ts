export declare class Currency {
    id: number;
    userId: number;
    walletId: number;
    symbol: string;
    withdrawalMode: string;
    minimumWithdrawal: string;
    minimumCollectAmount: string;
    lowerThreshold: string;
    upperThreshold: string;
    middleThreshold: string;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
