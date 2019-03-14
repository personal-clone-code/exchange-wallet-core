import {
  BaseWithdrawalPicker,
  IWithdrawalProcessingResult,
  getLogger,
  Utils,
  BaseGateway,
  IRawTransaction,
  getListTokenSymbols,
} from 'sota-common';
import _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import * as rawdb from '../../rawdb';
import { WithdrawalStatus, WithdrawalEvent } from '../../Enums';
import { HotWallet, Withdrawal, WithdrawalTx } from '../../entities';
import { inspect } from 'util';

const logger = getLogger('pickerDoProcess');
let hotWalletFailedCounter = 0;

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
  const limit = picker.getLimitPickingOnce();
  const currencies: string[] = getListTokenSymbols().tokenSymbols;
  // Pick a bunch of withdrawals and create a raw transaction for them
  const records = await rawdb.getNextPickedWithdrawals(manager, currencies, limit);
  if (!records.length) {
    logger.info(`No more withdrawal need to be picked up. Will try in the next tick...`);
    return emptyResult;
  }

  const withdrawalIds = records.map(w => w.id);
  const walletId = records[0].walletId;
  const currency = records[0].currency;
  const gateway = picker.getGateway(currency);
  const vouts = withdrawalsToVOuts(records);

  // Find an available internal hot wallet
  const hotWallet = await rawdb.findTransferableHotWallet(manager, walletId, vouts, currency, false, gateway);

  if (!hotWallet) {
    hotWalletFailedCounter += 1;
    // Raise issue if the hot wallet is not available for too long...
    if (hotWalletFailedCounter % 50 === 0) {
      logger.error(
        `No hot wallet is available walletId=${walletId} currency=${currency} failedCounter=${hotWalletFailedCounter}`
      );
    }
    // Else just print info and continue to wait
    else {
      logger.info(
        `No ${currency.toUpperCase()} hot wallet for wallet ${walletId} is available at the moment. Will wait for the next tick...`
      );
    }
    await updateTimestampForWithdrawals(manager, withdrawalIds);
    return emptyResult;
  }

  // Reset failed counter when there's available hot wallet
  hotWalletFailedCounter = 0;

  // Filter out the zero-outputs. We can prevent this case from creating withdrawals
  // But it may still happen though, so need the guarding mechanism here...

  let unsignedTx;
  try {
    unsignedTx = await gateway.createRawTransaction(hotWallet.address, _.compact(vouts));
  } catch (err) {
    // Most likely the fail reason is insufficient balance from hot wallet
    // Or there was problem with connection to the full node
    logger.error(
      `Could not create raw tx address=${hotWallet.address}, vouts=${inspect(vouts)}, error=${inspect(err)}`
    );
    // update withdrawal record
    await updateTimestampForWithdrawals(manager, withdrawalIds);
    return emptyResult;
  }

  if (!unsignedTx) {
    logger.error(`Could not construct unsigned tx. Just wait until the next tick...`);
    await updateTimestampForWithdrawals(manager, withdrawalIds);
    return emptyResult;
  }

  // Create withdrawal tx record
  const withdrawalTx = await updateUnsignedWithdrawals(manager, unsignedTx, hotWallet, currency, withdrawalIds);
  return {
    needNextProcess: true,
    withdrawalTxId: withdrawalTx.id,
  };
}

/**
 * Convert withdrawal records to v outs
 * @param records
 */
function withdrawalsToVOuts(records: Withdrawal[]): any[] {
  // Find an available hot wallet
  const vouts = records.map(w => {
    const amount = w.getAmount();
    if (parseFloat(amount) === 0) {
      return null;
    }

    return { toAddress: w.toAddress, amount };
  });
  return vouts;
}

/**
 * Update withdrawals and insert withdrawal tx by unsignedTx value
 * @param manager
 * @param unsignedTx
 * @param hotWallet
 * @param withdrawalIds
 */
async function updateUnsignedWithdrawals(
  manager: EntityManager,
  unsignedTx: IRawTransaction,
  hotWallet: HotWallet,
  currency: string,
  withdrawalIds: number[]
): Promise<WithdrawalTx> {
  // Create withdrawal tx record
  const withdrawalTx = await rawdb.insertWithdrawalTx(manager, {
    currency,
    hotWalletAddress: hotWallet.address,
    status: WithdrawalStatus.SIGNING,
    unsignedRaw: unsignedTx.unsignedRaw,
    unsignedTxid: unsignedTx.txid,
    createdAt: Utils.nowInMillis(),
    updatedAt: Utils.nowInMillis(),
  });

  // update withdrawal record
  const updatedValue = {
    withdrawalTxId: withdrawalTx.id,
    status: WithdrawalStatus.SIGNING,
    fromAddress: hotWallet.address,
    updatedAt: Utils.nowInMillis(),
  };

  await Utils.PromiseAll([
    manager.update(Withdrawal, withdrawalIds, updatedValue),
    rawdb.insertWithdrawalLogs(manager, withdrawalIds, WithdrawalEvent.PICKED, withdrawalTx.id),
  ]);
  return withdrawalTx;
}

/**
 * Update updatedAt field for withdrawal
 * @param manager
 * @param withdrawalIds
 */
async function updateTimestampForWithdrawals(manager: EntityManager, withdrawalIds: number[]) {
  // update withdrawal record
  const failedUpdateValue = {
    updatedAt: Utils.nowInMillis(),
  };
  await manager.update(Withdrawal, withdrawalIds, failedUpdateValue);
}

export default pickerDoProcess;
