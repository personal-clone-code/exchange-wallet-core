import fetch from 'node-fetch';
import { EntityManager, getConnection } from 'typeorm';
import { BaseIntervalWorker, getLogger, Utils } from 'sota-common';
import { WebhookType } from './Enums';
import { Webhook, WebhookProgress, Deposit, Withdrawal, UserCurrency, CurrencyToken } from './entities';
import * as rawdb from './rawdb';

const logger = getLogger('WebhookProcessor');

export class WebhookProcessor extends BaseIntervalWorker {
  protected _nextTickTimer: number = 10000;

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
    const progressRecord = await manager.getRepository(WebhookProgress).findOne(
      { isProcessed: false },
      {
        order: { updatedAt: 'ASC' },
      }
    );
    if (!progressRecord) {
      logger.debug(`No pending webhook to call. Let's wait for the next tick...`);
      return;
    }

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
    const headers = { 'Content-Type': 'application/json' };
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
        progressRecord.isProcessed = false;
      }
    } catch (err) {
      status = 0;
      msg = err.toString();
      progressRecord.isProcessed = false;
    }

    progressRecord.updatedAt = now;

    // Update progress & store log record
    await Utils.PromiseAll([
      rawdb.insertWebhookLog(manager, progressRecord.id, url, body, status, msg),
      manager.getRepository(WebhookProgress).save(progressRecord),
    ]);

    return;
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
      case WebhookType.DEPOSIT:
        data = await manager.getRepository(Deposit).findOne(refId);
        if (!data) {
          throw new Error(`Could not find deposit id=${refId}`);
        }

        const currencyToken = await manager.getRepository(CurrencyToken).findOne({ symbol: data.currency });
        if (currencyToken.contractAddress) {
          const userCurrency = await manager
            .getRepository(UserCurrency)
            .findOne({ userId, type: data.typeCurrency, contractAddress: currencyToken.contractAddress });
          if (userCurrency) {
            data.currency = userCurrency.symbol;
          }
        }

        data.typeCurrency = data.currency;

        return data;

      case WebhookType.WITHDRAWAL:
        data = await manager.getRepository(Withdrawal).findOne(refId);
        if (!data) {
          throw new Error(`Could not find withdrawal id=${refId}`);
        }
        return data;

      default:
        throw new Error(`Could not build webhook data for invalid type: ${type}`);
    }
  }
}
