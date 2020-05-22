import { BaseHotWalletSigner } from './BaseHotWalletSigner';
export declare class WithdrawalSigner extends BaseHotWalletSigner {
    protected updateRelatedTables(): Promise<void>;
}
