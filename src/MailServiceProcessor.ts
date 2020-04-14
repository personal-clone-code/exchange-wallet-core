import * as _ from 'lodash';
import { BaseIntervalWorker, getLogger, Mailer, registerMailEventCallback } from 'sota-common';
import { getConnection, EntityManager } from 'typeorm';
import * as rawdb from './rawdb';
import { renderTemplate } from './mailer/renderTemplate';
import { updateMailJobSent, increaseMailJobRetryCount, insertMailLogRecord, IMailJobProps } from './rawdb';
import { MailStatus } from './Enums';
import { MailJob } from './entities';

const logger = getLogger('MailServiceProcessor');

export class MailServiceProcessor extends BaseIntervalWorker {
  protected _nextTickTimer: number = 10000;

  protected async prepare(): Promise<void> {
    // Nothing to do...
  }

  protected doProcess(): Promise<void> {
    return getConnection().transaction(async manager => {
      try {
        await this._doProcess(manager);
      } catch (e) {
        logger.error(`MailServiceProcessor do process failed with error`);
        logger.error(e);
      }
    });
  }

  private async _doProcess(manager: EntityManager): Promise<void> {
    const allPendingJobs = await rawdb.pickSomePendingMailJobs(manager);
    if (!allPendingJobs || allPendingJobs.length === 0) {
      logger.info(`There are not mail job to be sent. Wait for next tick...`);
      return;
    }

    const tasks = _.map(allPendingJobs, async job => {
      await this._processOneRecord(manager, job);
    });
    await Promise.all(tasks);
    return;
  }

  private async _processOneRecord(manager: EntityManager, job: MailJob): Promise<void> {
    try {
      const mailContent = renderTemplate(job.templateName, JSON.parse(job.content));
      const mailer = Mailer.getInstance();
      await mailer.sendMail({
        from: `"${job.senderName}" <${job.senderAddress}>`,
        to: job.recipientAddress,
        subject: job.title,
        content: mailContent,
      });
      await updateMailJobSent(manager, job.id);
    } catch (err) {
      logger.error(`Could not sent mail with error`);
      logger.error(err);
      await increaseMailJobRetryCount(manager, job.id);
      // it mean, it failed many times.
      if (job.retryCount === 5) {
        await insertMailLogRecord(manager, {
          jobId: job.id,
          status: MailStatus.FAILED,
          msg: JSON.stringify(err.toString()),
        });
      }
    }
    return;
  }
}
