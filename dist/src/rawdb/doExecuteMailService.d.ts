import { EntityManager } from 'typeorm';
import { MailJob, MailLog } from '../entities';
import { MailStatus } from '../Enums';
export interface IMailJobProps {
    senderName: string;
    senderAddress: string;
    recipientAddress: string;
    title: string;
    templateName: string;
    content: any;
}
export interface IMailLogProps {
    jobId: number;
    status: MailStatus;
    msg?: string;
}
export declare function pickSomePendingMailJobs(manager: EntityManager): Promise<MailJob[]>;
export declare function insertMailJob(manager: EntityManager, props: IMailJobProps): Promise<MailJob>;
export declare function increaseMailJobRetryCount(manager: EntityManager, jobId: number): Promise<void>;
export declare function updateMailJobSent(manager: EntityManager, jobId: number): Promise<void>;
export declare function insertMailLogRecord(manager: EntityManager, props: IMailLogProps): Promise<MailLog>;
