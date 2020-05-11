import { EnvConfigRegistry, getLogger, getRedisSubscriber } from 'sota-common';
import { getConnection, EntityManager } from 'typeorm';
import * as rawdb from '../../rawdb';

const logger = getLogger('handleRedisMessage');

export async function handleRedisMessage(): Promise<void> {
  getRedisSubscriber().on('message', onRedisMessage);
}

async function onRedisMessage(channel: any, message: any) {
  const appId = EnvConfigRegistry.getAppId();
  if (appId !== channel) {
    return;
  }

  let messageObj: any = null;
  try {
    messageObj = JSON.parse(message);
  } catch (e) {
    logger.warn(`Unexpected message from redis: ${message}`);
  }

  if (!messageObj) {
    return;
  }

  const connection = await getConnection();
  if (messageObj) {
    switch (messageObj.event) {
      case 'EVENT_ADDRESS_BALANCE_CHANGED':
        await handleAddressBalanceChanged(connection.manager, messageObj.data);
        break;
      default:
        break;
    }
  }
}

async function handleAddressBalanceChanged(manager: EntityManager, messageData: any): Promise<void> {
  logger.info(
    `updateAddressBalanceFromNetwork: ${messageData.walletId} | ${messageData.currency} | ${messageData.address}`
  );
  await rawdb.updateAddressBalanceFromNetwork(manager, messageData.walletId, messageData.currency, messageData.address);
}

export default handleRedisMessage;
