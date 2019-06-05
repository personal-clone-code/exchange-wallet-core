import { getLogger, HotWalletType, Utils, BasePlatformWorker, CurrencyRegistry, GatewayRegistry } from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import { WithdrawalTx, Withdrawal } from '../../entities';
import { WithdrawalStatus, WithdrawalEvent } from '../../Enums';
import * as rawdb from '../../rawdb';

const logger = getLogger('signerDoProcess');

export async function signerDoProcess(signer: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _signerDoProcess(manager, signer);
  });
}

/**
 * The tasks of signer:
 * - Find one withdrawal_tx record that needs to be singning (status=`signing`)
 * - Find the hot wallet that construct the tx
 * - Create the signed content and store it on the withdrawal_tx record
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
  const statuses = [WithdrawalStatus.SIGNING];
  const withdrawalTx = await rawdb.findOneWithdrawalTx(manager, allSymbols, statuses);

  if (!withdrawalTx) {
    logger.info(`There are no signing withdrawals to process: platform=${platformCurrency.platform}`);
    return;
  }

  const currency = CurrencyRegistry.getOneCurrency(withdrawalTx.currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  const withdrawalTxId = withdrawalTx.id;
  const hotWallet = await rawdb.getOneHotWallet(manager, currency.platform, withdrawalTx.hotWalletAddress);

  // TODO: handle multisig hot wallet
  if (hotWallet.type !== HotWalletType.Normal) {
    throw new Error(`Only support normal hot wallet at the moment.`);
  }

  const rawPrivateKey = await hotWallet.extractRawPrivateKey();
  const signedTx = await gateway.signRawTransaction(withdrawalTx.unsignedRaw, rawPrivateKey);
  const status = WithdrawalStatus.SIGNED;
  const txid = signedTx.txid;

  withdrawalTx.status = status;
  withdrawalTx.txid = txid;
  withdrawalTx.signedRaw = signedTx.signedRaw;

  await Utils.PromiseAll([
    manager.getRepository(WithdrawalTx).save(withdrawalTx),
    manager.getRepository(Withdrawal).update({ withdrawalTxId }, { status, txid }),
    rawdb.insertWithdrawalLogs(manager, [withdrawalTx.id], WithdrawalEvent.SIGNED, withdrawalTx.id, withdrawalTx.txid),
  ]);

  logger.info(`Signed withdrawalTx id=${withdrawalTxId}, platform=${platformCurrency.platform}, txid=${txid}`);

  return;
}
