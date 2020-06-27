import { BasePlatformWorker, IRawTransaction } from 'sota-common';
import { Deposit } from '../../entities';
export declare function collectorDoProcess(collector: BasePlatformWorker): Promise<void>;
export declare function _constructUtxoBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction>;
