import { Address } from '../../../entities';
import { BaseSigner } from './BaseSigner';
export declare class WithdrawalCollectSigner extends BaseSigner {
    protected address: Address;
    protected prepare(): Promise<void>;
    protected isBusy(): Promise<boolean>;
    protected signTx(): Promise<void>;
    protected updateRelatedTables(): Promise<void>;
}
