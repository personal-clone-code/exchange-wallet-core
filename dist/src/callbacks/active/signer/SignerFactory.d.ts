import { LocalTx } from '../../../entities';
import { BaseSigner } from './BaseSigner';
export declare class SignerFactory {
    static getSigner(localTx: LocalTx): BaseSigner;
}
