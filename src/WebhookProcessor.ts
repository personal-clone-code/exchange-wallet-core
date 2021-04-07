import fetch from 'node-fetch';
import { EntityManager, getConnection, LessThanOrEqual } from 'typeorm';
import { BaseIntervalWorker, getLogger, Utils, CurrencyRegistry, EnvConfigRegistry } from 'sota-common';
import { WebhookType, LocalTxStatus, WithdrawalStatus, CollectStatus } from './Enums';
import { Webhook, WebhookProgress, Deposit, Withdrawal, UserCurrency, LocalTx } from './entities';
import * as rawdb from './rawdb';

const logger = getLogger('WebhookProcessor');

export class WebhookProcessor extends BaseIntervalWorker {
  protected _nextTickTimer: number = 10000;

  protected async prepare(): Promise<void> {
    // Nothing to do...
  }

  protected async doProcess(): Promise<void> {
    return getConnection().transaction(async manager => {
      try {
        await this._doProcess(manager);
      } catch (e) {
        logger.error(`WebhookProcessor do process failed with error`);
        logger.error(e);
      } 
    });
  }

  private async _doProcess(manager: EntityManager): Promise<void> {
    // If a record has retryCount > maxRetryCount we consider it as FAILED, FAILED record will not need to be processed
    const maxRetryCount = parseInt(EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_PROGRESS_RETRY_COUNT')) || 5; 
    const maxRecordsToProcess = parseInt(EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_RECORDS_TO_PROCESS')) || 100;

    const progressRecords = await manager.getRepository(WebhookProgress).find({
        where: { isProcessed: false, retryCount: LessThanOrEqual(maxRetryCount)},
        order: { updatedAt: 'ASC' },
        take: maxRecordsToProcess,
      });
    if (!progressRecords.length) {
      logger.debug(`No pending webhook to call. Let's wait for the next tick...`);
      return;
    }

    await Promise.all(progressRecords.map(async record => this._processRecord(record, manager)));

    return;
  }

  /**
   * Get related data, fire the webhook and update webhook progress
   * @param progressRecord 
   * @param manager 
   * @returns 
   */
  private async _processRecord(progressRecord: WebhookProgress,manager: EntityManager) {
    const webhookId = progressRecord.webhookId;
    const webhookRecord = await manager.getRepository(Webhook).findOne(webhookId);
    if (!webhookRecord) {
      throw new Error(`Progress <${progressRecord.id}> has invalid webhook id: ${webhookId}`);
    }

    const url = webhookRecord.url;
    // TODO: also check the url format here
    if (!url) {
      logger.error(`Webhook <${webhookId}> has invalid url: ${url}`);
      return;
    }

    const now = Utils.nowInMillis();
    const type = progressRecord.type as WebhookType;
    const refId = progressRecord.refId;
    const event = progressRecord.event;
    const data = await this._getRefData(manager, type, refId, webhookRecord.userId);

    // Call webhook
    const method = 'POST';
    const body = JSON.stringify({ type, event, data });
    const username = EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_USER');
    const password = EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_PASSWORD');
    if (!username || !password) {
      throw new Error(`Webhook authorization is missing. Please check your config.`);
    }
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`,
    };
    const timeout = 5000;
    let status: number;
    let msg: string;

    try {
      const resp = await fetch(url, { method, body, headers, timeout });
      status = resp.status;
      msg = resp.statusText || JSON.stringify(resp.json());

      if (status === 200) {
        progressRecord.isProcessed = true;
      } else {
        progressRecord.retryCount += 1;
        progressRecord.isProcessed = false;
      }
    } catch (err) {
      status = 0;
      msg = err.toString();
      progressRecord.retryCount += 1;
      progressRecord.isProcessed = false;
    }

    progressRecord.updatedAt = now;

    // Update progress & store log record
    await Utils.PromiseAll([
      rawdb.insertWebhookLog(manager, progressRecord.id, url, body, status, msg),
      manager.getRepository(WebhookProgress).save(progressRecord),
    ]);
  }

  /**
   * @deprecated returned data of this function will be deprecated
   */
  private async _getRefData(
    manager: EntityManager,
    type: WebhookType,
    refId: number,
    userId: number
  ): Promise<Deposit | Withdrawal> {
    let data;
    switch (type) {
      case WebhookType.DEPOSIT: {
        data = await manager.getRepository(Deposit).findOne(refId);
        if (!data) {
          throw new Error(`Could not find deposit id=${refId}`);
        }

        const userCurrency = await manager.getRepository(UserCurrency).findOne({ userId, systemSymbol: data.currency });
        if (userCurrency) {
          data.currency = userCurrency.customSymbol;
        } else {
          const currency = CurrencyRegistry.getOneCurrency(data.currency);
          data.currency = currency.networkSymbol;
        }

        // Only return fee amount when the transaction was verified on the network
        if (data.status === CollectStatus.COLLECTED) {
          const localTx = await manager.getRepository(LocalTx).findOne({ txid: data.txid, status: LocalTxStatus.COMPLETED })
          data.transactionFee = localTx?.feeAmount;
        }

        return data;
      }

      case WebhookType.WITHDRAWAL: {
        data = await manager.getRepository(Withdrawal).findOne(refId);
        if (!data) {
          throw new Error(`Could not find withdrawal id=${refId}`);
        }

        const userCurrency = await manager.getRepository(UserCurrency).findOne({ userId, systemSymbol: data.currency });
        if (userCurrency) {
          data.currency = userCurrency.customSymbol;
        } else {
          const currency = CurrencyRegistry.getOneCurrency(data.currency);
          data.currency = currency.networkSymbol;
        }
        
        // Only return fee amount when the transaction was verified on the network
        if (data.status === WithdrawalStatus.COMPLETED) {
          const localTx = await manager.getRepository(LocalTx).findOne({ txid: data.txid, status: LocalTxStatus.COMPLETED })
          data.transactionFee = localTx?.feeAmount;
        }

        return data;
      }

      default:
        throw new Error(`Could not build webhook data for invalid type: ${type}`);
    }
  }
}
