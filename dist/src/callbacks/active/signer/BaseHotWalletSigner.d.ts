import { BaseSigner } from './BaseSigner';
import { HotWallet } from '../../../entities';
export declare abstract class BaseHotWalletSigner extends BaseSigner {
    protected hotWallet: HotWallet;
    protected prepare(): Promise<void>;
    protected isBusy(): Promise<boolean>;
    protected signTx(): Promise<void>;
}
