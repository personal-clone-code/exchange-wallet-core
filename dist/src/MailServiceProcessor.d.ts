import { BaseIntervalWorker } from 'sota-common';
export declare class MailServiceProcessor extends BaseIntervalWorker {
    protected _nextTickTimer: number;
    protected prepare(): Promise<void>;
    protected doProcess(): Promise<void>;
    private _doProcess;
    private _processOneRecord;
}
