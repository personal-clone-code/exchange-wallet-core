import * as _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import { getLogger } from 'sota-common';
import { User, Webhook } from '../entities';

const logger = getLogger('DBTools::# Webhook::');

export async function doCheckWebhook(): Promise<void> {
  await getConnection().transaction(async manager => {
    await _doCheckWebhook(manager);
  });
}

async function _doCheckWebhook(manager: EntityManager): Promise<void> {
  logger.info(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
  logger.info(`Start checking...`);
  const webhookErrors: string[] = [];
  const users = await manager.getRepository(User).find();
  if (!users || users.length === 0) {
    logger.warn(`There\'re no users. So, skipping.`);
    return;
  }
  const tasks = _.map(users, async user => {
    const webhook = await manager.getRepository(Webhook).findOne({
      where: {
        userId: user.id,
      },
      order: {
        id: 'DESC',
      },
    });
    if (!webhook || !webhook.url || webhook.url.length === 0) {
      webhookErrors.push(`User ${user.id} doesn\'t register any webhook url.`);
    }
  });
  await Promise.all(tasks);
  logger.info(
    `${JSON.stringify({
      isOK: webhookErrors.length === 0,
      totalErrors: webhookErrors.length,
      details: webhookErrors,
    })}`
  );
  logger.info(`Finished!`);
  logger.info(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
  return;
}
