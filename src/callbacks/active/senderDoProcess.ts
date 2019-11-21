import {
  getLogger,
  ISubmittedTransaction,
  TransactionStatus,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  GatewayRegistry,
} from 'sota-common';
import * as rawdb from '../../rawdb';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalEvent, LocalTxStatus, WithdrawalStatus, DepositEvent, CollectStatus } from '../../Enums';
import { Withdrawal, LocalTx } from '../../entities';
import util from 'util';

const logger = getLogger('senderDoProcess');

export async function senderDoProcess(sender: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _senderDoProcess(manager, sender);
  });
}

/**
 * Tasks of sender:
 * - Find 1 local_tx record that `status` = `signed`
 * - Try to submit its rawtx data to the network
 * - Update real txid back into corresponding local_tx and withdrawal records
 *
 * Now the tx should be submitted to the network, and wait for the verifying phase
 *
 * @param manager
 * @param sender
 */
async function _senderDoProcess(manager: EntityManager, sender: BasePlatformWorker): Promise<void> {
  const platformCurrency = sender.getCurrency();
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = allCurrencies.map(c => c.symbol);
  const signedRecord = await rawdb.findOneLocalTx(manager, allSymbols, [LocalTxStatus.SIGNED]);

  if (!signedRecord) {
    logger.info(`There are not signed localTx to be sent: platform=${platformCurrency.platform}`);
    return;
  }

  const currency = CurrencyRegistry.getOneCurrency(signedRecord.currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  let sentResultObj: ISubmittedTransaction = null;
  const prefix: string = 'TMP_';
  const txid = signedRecord.txid;

  // If transaction has valid is, not the temporary one
  // We'll check whether its status is determined or not on the network
  if (signedRecord.txid.indexOf(prefix) === -1) {
    try {
      const status = await gateway.getTransactionStatus(txid);
      if (status === TransactionStatus.COMPLETED || status === TransactionStatus.CONFIRMING) {
        await updateLocalTxAndRelatedTables(manager, signedRecord, txid, LocalTxStatus.SENT);
        return;
      }

      // If transaction is determined as failed, the withdrawal is failed as well
      if (status === TransactionStatus.FAILED) {
        await updateLocalTxAndRelatedTables(manager, signedRecord, txid, LocalTxStatus.FAILED);
        return;
      }
    } catch (e) {
      const status = TransactionStatus.UNKNOWN;
      // await updateLocalTxAndRelatedTables(manager, signedRecord, txid, LocalTxStatus.FAILED);
    }
    // If transaction status is completed or confirming, both mean the withdrawal was submitted to network successfully
  }

  // for unknown transaction or temporary transaction
  // send transaction directly
  try {
    sentResultObj = await gateway.sendRawTransaction(signedRecord.signedRaw);
  } catch (e) {
    let errInfo = e;
    let extraInfo = null;

    // Axios error
    if (e.isAxiosError) {
      extraInfo = {
        url: e.config.url,
        method: e.config.method,
        data: e.config.data,
        headers: e.config.headers,
        auth: e.config.auth,
        timeout: e.config.timeout,
        status: e.response.status,
      };
      errInfo = JSON.stringify(e.response.data);
    }

    logger.error(
      `Cannot broadcast localTxId=${signedRecord.id} due to error\
        errInfo=${util.inspect(errInfo)} \
        extraInfo=${util.inspect(extraInfo)}`
    );

    // The localTx record is created wrongly. It must be reconstructed
    if ((errInfo.toString() as string).includes('nonce too low')) {
      await reconstructLocalTx(manager, signedRecord);
    }

    return;
  }

  if (sentResultObj) {
    await updateLocalTxAndRelatedTables(manager, signedRecord, sentResultObj.txid, LocalTxStatus.SENT);
    return;
  } else {
    logger.error(`Could not send raw transaction localTxId=${signedRecord.id}. Result is empty, please check...`);
  }

  return;
}

async function updateLocalTxAndRelatedTables(
  manager: EntityManager,
  localTx: LocalTx,
  txid: string,
  status: LocalTxStatus.SENT | LocalTxStatus.FAILED
): Promise<void> {
  if (status === LocalTxStatus.FAILED) {
    reconstructLocalTx(manager, localTx, { txid });
    return;
  }

  logger.info(`senderDoProcess: broadcast tx to network successfully: ${txid}`);

  await rawdb.updateLocalTxStatus(manager, localTx.id, LocalTxStatus.SENT, { txid });

  if (localTx.isWithdrawal()) {
    await rawdb.updateWithdrawalsStatus(manager, localTx.id, WithdrawalStatus.SENT, WithdrawalEvent.TXID_CHANGED, {
      txid,
    });
  } else if (localTx.isCollectTx()) {
    await rawdb.updateDepositCollectStatusByCollectTxId(
      manager,
      localTx,
      CollectStatus.COLLECT_SENT,
      DepositEvent.COLLECT_SENT
    );
  } else if (localTx.isSeedTx()) {
    await rawdb.updateDepositCollectStatusBySeedTxId(manager, localTx, CollectStatus.SEED_SENT, DepositEvent.SEED_SENT);
  } else {
    throw new Error(`Not support localTxType: ${localTx.type}`);
  }
}

/**
 * The localTx record is constructed wrongly
 * This correction will:
 * - Mark the localTx status to `failed`
 * - Reset related tables status in order to create a new local tx again
 * And the picker and signer will do the signing flow again
 */
async function reconstructLocalTx(
  manager: EntityManager,
  localTx: LocalTx,
  txResult?: ISubmittedTransaction
): Promise<void> {
  await rawdb.updateLocalTxStatus(manager, localTx.id, LocalTxStatus.FAILED);
  if (localTx.isWithdrawal()) {
    await rawdb.updateWithdrawalsStatus(
      manager,
      localTx.id,
      WithdrawalStatus.UNSIGNED,
      WithdrawalEvent.TXID_CHANGED,
      txResult
    );
  } else if (localTx.isCollectTx()) {
    await rawdb.updateDepositCollectStatusByCollectTxId(
      manager,
      localTx,
      CollectStatus.UNCOLLECTED,
      DepositEvent.COLLECT_TXID_CHANGED
    );
  } else if (localTx.isSeedTx()) {
    await rawdb.updateDepositCollectStatusBySeedTxId(
      manager,
      localTx,
      CollectStatus.SEED_REQUESTED,
      DepositEvent.SEED_TXID_CHANGED
    );
  } else {
    throw new Error(`Not support localTxType: ${localTx.type}`);
  }
}
