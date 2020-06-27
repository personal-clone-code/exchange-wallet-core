import { BaseCurrencyWorker } from 'sota-common';
export declare class MaxFeeDoProcessor extends BaseCurrencyWorker {
    protected _nextTickTimer: number;
}
export declare function maxFeeDoProcess(process: MaxFeeDoProcessor): Promise<void>;
export default maxFeeDoProcess;
