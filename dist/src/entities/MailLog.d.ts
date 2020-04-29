import { MailStatus } from '../Enums';
export declare class MailLog {
    id: number;
    jobId: number;
    status: MailStatus;
    msg: string;
    createdAt: number;
    updateCreateDates(): void;
}
