import { BaseSigner } from './BaseSigner';
import { Address, Deposit } from '../../../entities';
export declare class CollectingSigner extends BaseSigner {
    protected signingAddresses: Address[];
    protected deposits: Deposit[];
    protected prepare(): Promise<void>;
    protected isBusy(): Promise<boolean>;
    protected signTx(): Promise<void>;
    protected updateRelatedTables(): Promise<void>;
}
