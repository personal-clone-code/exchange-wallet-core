import { Utils } from 'sota-common';
import { EntityManager, LessThan } from 'typeorm';
import { MailJob, MailLog } from '../entities';
import { MailStatus } from '../Enums';

export interface IMailJobProps {
  // type: MailType;
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

export async function pickSomePendingMailJobs(manager: EntityManager): Promise<MailJob[]> {
  const nextJobs = await manager.getRepository(MailJob).find({
    where: {
      updatedAt: LessThan(Utils.now()),
      isSent: false,
      retryCount: LessThan(6),
    },
    order: {
      updatedAt: 'ASC',
    },
    take: 10,
  });
  return nextJobs;
}

export async function insertMailJob(manager: EntityManager, props: IMailJobProps): Promise<MailJob> {
  const newJob = new MailJob();
  newJob.senderName = props.senderName;
  newJob.senderAddress = props.senderAddress;
  newJob.recipientAddress = props.recipientAddress;
  newJob.title = props.title;
  newJob.templateName = props.templateName;
  newJob.content = JSON.stringify(props.content);

  const result = await manager.save(newJob);
  await insertMailLogRecord(manager, {
    jobId: result.id,
    status: MailStatus.CREATED,
  });
  return result;
}

export async function increaseMailJobRetryCount(manager: EntityManager, jobId: number): Promise<void> {
  await manager
    .createQueryBuilder()
    .update(MailJob)
    .set({
      retryCount: () => `retry_count + 1`,
      updatedAt: () => `${Utils.now() + 3 * 60 * 1000}`,
    })
    .where({
      id: jobId,
    })
    .execute();
  return;
}

export async function updateMailJobSent(manager: EntityManager, jobId: number): Promise<void> {
  await manager.update(MailJob, { id: jobId }, { isSent: true });
  await insertMailLogRecord(manager, {
    jobId,
    status: MailStatus.SENT,
    msg: 'OK',
  });
  return;
}

export async function insertMailLogRecord(manager: EntityManager, props: IMailLogProps): Promise<MailLog> {
  const mailLog = new MailLog();
  mailLog.jobId = props.jobId;
  mailLog.status = props.status;
  mailLog.msg = props.msg;
  return manager.save(mailLog);
}
