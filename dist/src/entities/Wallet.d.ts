export declare class Wallet {
    id: number;
    userId: number;
    label: string;
    currency: string;
    withdrawalMode: string;
    secret: string;
    isHd: boolean;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
