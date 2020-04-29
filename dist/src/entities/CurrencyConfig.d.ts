export declare class CurrencyConfig {
    currency: string;
    network: string;
    chainId: string;
    chainName: string;
    averageBlockTime: number;
    requiredConfirmations: number;
    internalEndpoint: string;
    rpcEndpoint: string;
    restEndpoint: string;
    explorerEndpoint: string;
    createdAt: number;
    updatedAt: number;
    updateCreateDates(): void;
    updateUpdateDates(): void;
}
