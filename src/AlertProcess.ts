import { BaseIntervalWorker, getLogger, Utils, EnvConfigRegistry } from 'sota-common';
import { v1 as uuid } from 'uuid';
import { getConnection, EntityManager, LessThan, In, Not } from 'typeorm';
import { Withdrawal, Deposit, LocalTx } from './entities';
import { CollectStatus, WithdrawalStatus } from './Enums';
import { insertMailJob, IMailJobProps } from './rawdb';

const logger = getLogger('AlertProcess');
const waitingTime = 6 * 60 * 60 * 1000; // 6 hours

export class AlertProcess extends BaseIntervalWorker {
  protected _nextTickTimer: number = 10 * 60 * 1000; // 10 minutes
  protected readonly _id: string;

  constructor() {
    super();
    this._id = uuid();
  }

  protected async prepare(): Promise<void> {
    // Nothing to do...
  }

  protected async doProcess(): Promise<void> {
    return getConnection().transaction(async manager => {
      try {
        await this._doProcess(manager);
      } catch (e) {
        logger.error(`AlertProcess do process failed with error`);
        logger.error(e);
      }
    });
  }

  private async _doProcess(manager: EntityManager): Promise<void> {
    const [pendingWithdrawals, pendingLocalTxs, pendingCollects] = await Promise.all([
      this._getAllPendingWithdrawals(manager),
      this._getAllPendingLocalTxs(manager),
      this._getAllUnCollectDeposits(manager),
    ]);
    if (!pendingWithdrawals.length && !pendingLocalTxs.length && !pendingCollects.length) {
      logger.info(`Dont have record pending too long`);
      return;
    }
    logger.info(`There are some records pending too long, send mail to operators`);
    // replace with mail job
    const appName: string = process.env.APP_NAME || '【Bitcastle】';
    const sender = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_ADDRESS');
    const senderName = EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_NAME');
    const receiver = EnvConfigRegistry.getCustomEnvConfig('MAIL_RECIPIENT_ERROR_ALERT');
    if (!receiver || !Utils.isValidEmail(receiver)) {
      logger.error(`Mailer could not send email to receiver=${receiver}. Please check it.`);
      return;
    }
    const mailProps: IMailJobProps = {
      senderName,
      senderAddress: sender,
      recipientAddress: receiver,
      title: `${appName} Some withdrawals, deposits, local transactions are pending too long`,
      templateName: 'alert_record_pending_too_long_layout.hbs',
      content: {
        recipient_email: receiver,
        pending_withdrawals:
          pendingWithdrawals && pendingWithdrawals.length !== 0 ? pendingWithdrawals.join(', ') : 'Nothing',
        pending_local_txs: pendingLocalTxs && pendingLocalTxs.length !== 0 ? pendingLocalTxs.join(', ') : 'Nothing',
        pending_collects: pendingCollects && pendingCollects.length !== 0 ? pendingCollects.join(', ') : 'Nothing',
      },
    };
    await insertMailJob(manager, mailProps);
    return;
  }

  private async _getAllPendingLocalTxs(manager: EntityManager): Promise<number[]> {
    const now = Utils.nowInMillis();
    const pendingLocalTxs = await manager.getRepository(LocalTx).find({
      where: {
        status: Not(In([WithdrawalStatus.FAILED, WithdrawalStatus.COMPLETED])),
        createdAt: LessThan(now - waitingTime),
      },
    });
    return pendingLocalTxs.map(_record => _record.id);
  }

  private async _getAllPendingWithdrawals(manager: EntityManager): Promise<number[]> {
    const now = Utils.nowInMillis();
    const pendingWithdrawals = await manager.getRepository(Withdrawal).find({
      where: {
        status: Not(In([WithdrawalStatus.FAILED, WithdrawalStatus.COMPLETED])),
        createAt: waitingTime ? LessThan(now - waitingTime) : undefined,
      },
    });
    return pendingWithdrawals.map(_record => _record.id);
  }

  private async _getAllUnCollectDeposits(manager: EntityManager): Promise<number[]> {
    const now = Utils.nowInMillis();
    const pendingCollect = await manager.getRepository(Deposit).find({
      where: {
        collectStatus: In([CollectStatus.UNCOLLECTED, CollectStatus.COLLECTING, CollectStatus.SEED_REQUESTED]),
        createAt: waitingTime ? LessThan(now - waitingTime) : undefined,
      },
    });
    return pendingCollect.map(_record => _record.id);
  }
}
