import { BaseIntervalWorker } from 'sota-common';
export declare class AlertProcess extends BaseIntervalWorker {
    protected _nextTickTimer: number;
    protected readonly _id: string;
    constructor();
    protected prepare(): Promise<void>;
    protected doProcess(): Promise<void>;
    private _doProcess;
    private _getAllPendingLocalTxs;
    private _getAllPendingWithdrawals;
    private _getAllUnCollectDeposits;
}
