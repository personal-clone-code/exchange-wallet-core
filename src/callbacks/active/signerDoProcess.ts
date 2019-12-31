import { getLogger, HotWalletType, Utils, BasePlatformWorker, CurrencyRegistry, GatewayRegistry } from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalTx, Withdrawal } from '../../entities';
import { WithdrawalStatus, WithdrawalEvent, LocalTxStatus } from '../../Enums';
import * as rawdb from '../../rawdb';
import { SignerFactory } from './signer/SignerFactory';

const logger = getLogger('signerDoProcess');
let failedCounter = 0;

export async function signerDoProcess(signer: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _signerDoProcess(manager, signer);
  });
}

/**
 * The tasks of signer:
 * - Find one local_tx record that needs to be singning (status=`signing`)
 * - Find the hot wallet that construct the tx
 * - Create the signed content and store it on the local_tx record
 * - Change status to `signed`
 *
 * Then the raw tx is ready to submit to the network
 *
 * @param manager
 * @param signer
 */
async function _signerDoProcess(manager: EntityManager, signer: BasePlatformWorker): Promise<void> {
  const platformCurrency = signer.getCurrency();
  const allCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = allCurrencies.map(c => c.symbol);
  const statuses = [LocalTxStatus.SIGNING];
  const localTx = await rawdb.findOneLocalTx(manager, allSymbols, statuses);

  if (!localTx) {
    logger.info(`There are no signing localTx to process: platform=${platformCurrency.platform}`);
    return;
  }

  failedCounter = await SignerFactory.getSigner(localTx).proceed(manager, failedCounter);
}
