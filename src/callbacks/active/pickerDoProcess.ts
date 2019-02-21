import {
  BaseWithdrawalPicker,
  IWithdrawalProcessingResult,
  getLogger,
  Utils,
  BaseGateway,
  getListTokenSymbols,
} from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { WithdrawalStatus, WithdrawalEvent } from '../../Enums';
import { Withdrawal } from '../../entities';
import { inspect } from 'util';

const logger = getLogger('pickerDoProcess');

const emptyResult: IWithdrawalProcessingResult = {
  needNextProcess: false,
  withdrawalTxId: 0,
};

export async function pickerDoProcess(picker: BaseWithdrawalPicker): Promise<IWithdrawalProcessingResult> {
  let result: IWithdrawalProcessingResult = null;
  await getConnection().transaction(async manager => {
    result = await _pickerDoProcess(manager, picker);
  });
  return result;
}

/**
 * Picker do process
 * @param manager
 * @param picker
 * @private
 */
async function _pickerDoProcess(
  manager: EntityManager,
  picker: BaseWithdrawalPicker
): Promise<IWithdrawalProcessingResult> {
  let gateway: BaseGateway;
  const limit = picker.getLimitPickingOnce();

  const nextCurrency = await rawdb.getNextPickerCurrency(manager, getListTokenSymbols().tokenSymbols);

  if (!nextCurrency) {
    logger.info(
      `There are not unsigned ${getListTokenSymbols().tokenSymbolsBuilder.toUpperCase()} withdrawals to process`
    );
    return emptyResult;
  }

  const currency = nextCurrency;
  gateway = picker.getGateway(currency);
  return _pickerSubDoProcess(manager, currency, limit, gateway);
}

async function _pickerSubDoProcess(
  manager: EntityManager,
  currency: string,
  limit: number,
  gateway: BaseGateway
): Promise<IWithdrawalProcessingResult> {
  const hasPendingWithdrawal = await rawdb.hasPendingWithdrawal(manager, currency);
  if (hasPendingWithdrawal) {
    logger.info(`There're pending withdrawal transactions right now. Will try to process later...`);
    return emptyResult;
  }

  // Find an available hot wallet
  const hotWallet = await rawdb.findAvailableHotWallet(manager, currency, false);

  if (!hotWallet) {
    logger.info(
      `No ${currency.toString().toUpperCase()} hot wallet is available at the moment. Will wait for the next tick...`
    );
    return emptyResult;
  }

  // Pick a bunch of withdrawals and create a raw transaction for them
  const status = WithdrawalStatus.UNSIGNED;
  const records = await rawdb.findWithdrawalsByStatus(manager, currency, status, limit);
  if (!records.length) {
    logger.info(`No more withdrawal need to be picked up. Will try in the next tick...`);
    return emptyResult;
  }

  // Find an available hot wallet
  const vouts = records.map(w => {
    return { toAddress: w.toAddress, amount: w.getAmount() };
  });

  let unsignedTx;
  try {
    unsignedTx = await gateway.createRawTransaction(hotWallet.address, vouts);
  } catch (err) {
    // Most likely the fail reason is insufficient balance from hot wallet
    // Or there was problem with connection to the full node
    logger.error(`Could not create raw tx due to error: ${inspect(err)}`);
    return emptyResult;
  }

  // TODO: Update timestamp of problematic withdrawals here?
  if (!unsignedTx) {
    throw new Error(`Could not construct unsigned tx. Just wait until the next tick...`);
  }

  // Create withdrawal tx record
  const withdrawalTx = await rawdb.insertWithdrawalTx(manager, {
    currency,
    hotWalletAddress: hotWallet.address,
    status: WithdrawalStatus.SIGNING,
    unsignedRaw: unsignedTx.unsignedRaw,
    unsignedTxid: unsignedTx.txid,
    createdAt: Utils.nowInMillis(),
  });

  // update withdrawal record
  const withdrawalIds = records.map(w => w.id);
  const updatedValue = {
    withdrawalTxId: withdrawalTx.id,
    status: WithdrawalStatus.SIGNING,
    fromAddress: hotWallet.address,
  };

  await Utils.PromiseAll([
    manager.update(Withdrawal, withdrawalIds, updatedValue),
    rawdb.insertWithdrawalLogs(manager, withdrawalIds, WithdrawalEvent.PICKED, withdrawalTx.id),
  ]);

  return {
    needNextProcess: true,
    withdrawalTxId: withdrawalTx.id,
  };
}

export default pickerDoProcess;
