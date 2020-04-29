export declare class Address {
    walletId: number;
    currency: string;
    address: string;
    isExternal: boolean;
    isHd: boolean;
    hdPath: string;
    secret: string;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
    extractRawPrivateKey(): Promise<string>;
}
