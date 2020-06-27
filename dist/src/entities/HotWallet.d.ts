export declare class HotWallet {
    userId: number;
    walletId: number;
    address: string;
    currency: string;
    type: string;
    secret: string;
    balance: string;
    isExternal: boolean;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
    extractRawPrivateKey(): Promise<string>;
}
