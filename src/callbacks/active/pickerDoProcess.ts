import _ from 'lodash';
import { EntityManager, getConnection } from 'typeorm';
import {
  getLogger,
  BaseCurrencyWorker,
  UTXOBasedGateway,
  GatewayRegistry,
  CurrencyRegistry,
  BigNumber,
  IRawVOut,
  IRawTransaction,
  AccountBasedGateway,
  ICurrency,
  HotWalletType,
} from 'sota-common';
import { Withdrawal, HotWallet, Address } from '../../entities';
import { inspect } from 'util';
import * as rawdb from '../../rawdb';
import { WithdrawalStatus, WithdrawOutType } from '../../Enums';

const logger = getLogger('pickerDoProcess');
const TMP_ADDRESS = 'TMP_ADDRESS';
let failedCounter = 0;

interface IWithdrawlParams {
  senderWallet: HotWallet | Address;
  finalPickedWithdrawals: Withdrawal[];
  amount: BigNumber;
}
export async function pickerDoProcess(picker: BaseCurrencyWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _pickerDoProcess(manager, picker);
  });
}

/**
 * Tasks of picker:
 * - Find withdrawals that can be picked next round (see how records will be chosen in `getNextPickedWithdrawals` method)
 * - Find a sender wallet, which is free (no pending transaction) and sufficient for requesting amount
 * - Create a local_tx record, which will cover for the withdrawals above:
 *   + For utxo-based currencies, we can process many withdrawals in one tx
 *   + For account-based currencies, we can only process 1 withdrawal in one tx
 * - Update `local_tx_id` and change `status` to `signing` for all selected withdrawal records
 * - The tx is ready to be signed now
 *
 * Then the transaction should be ready to send to the network
 *
 * @param manager
 * @param picker
 * @private
 */
async function _pickerDoProcess(manager: EntityManager, picker: BaseCurrencyWorker): Promise<void> {
  // Pick a bunch of withdrawals and create a raw transaction for them
  const iCurrency = picker.getCurrency();
  const candidateWithdrawals = await rawdb.getNextPickedWithdrawals(manager, iCurrency.platform);
  if (!candidateWithdrawals || candidateWithdrawals.length === 0) {
    logger.info(`No more withdrawal need to be picked up. Will check upperthreshold sender wallet the next tick...`);
    await rawdb.checkUpperThreshold(manager, iCurrency.platform);
    return;
  }

  const walletId = candidateWithdrawals[0].walletId;
  const symbol = candidateWithdrawals[0].currency;
  const currency = CurrencyRegistry.getOneCurrency(symbol);
  let withdrawlParams: IWithdrawlParams;
  if (currency.isUTXOBased) {
    withdrawlParams = await _pickerDoProcessUTXO(candidateWithdrawals, currency, manager);
  } else {
    withdrawlParams = await _pickerDoProcessAccountBase(candidateWithdrawals, manager);
  }
  const finalPickedWithdrawals: Withdrawal[] = withdrawlParams.finalPickedWithdrawals;
  if (!finalPickedWithdrawals.length) {
    logger.info(`Dont have suitable withdrawl record to pick`);
    return;
  }
  const senderWallet = withdrawlParams.senderWallet;
  const withdrawalIds = finalPickedWithdrawals.map(w => w.id);
  if (!senderWallet) {
    failedCounter += 1;
    if (failedCounter % 50 === 0) {
      // Raise issue if the sender wallet is not available for too long...
      logger.error(
        `No available sender wallet walletId=${walletId} currency=${currency} failedCounter=${failedCounter}`
      );
    } else {
      // Else just print info and continue to wait
      logger.info(`No available sender wallet at the moment: walletId=${walletId} currency=${currency}`);
    }

    await rawdb.updateRecordsTimestamp(manager, Withdrawal, withdrawalIds);

    return;
  }

  // Reset failed counter when there's available sender wallet
  failedCounter = 0;

  const unsignedTx: IRawTransaction = await _constructRawTransaction(currency, withdrawlParams, manager);

  if (!unsignedTx) {
    logger.error(`Could not construct unsigned tx. Just wait until the next tick...`);
    await rawdb.updateRecordsTimestamp(manager, Withdrawal, withdrawalIds);
    return;
  }

  // Create withdrawal tx record
  try {
    await rawdb.doPickingWithdrawals(
      manager,
      unsignedTx,
      senderWallet,
      currency.symbol,
      finalPickedWithdrawals
      // withdrawlParams.amount
    );
  } catch (e) {
    logger.fatal(`Could not finish picking withdrawal ids=[${withdrawalIds}] err=${e.toString()}`);
    throw e;
  }

  return;
}

async function _pickerDoProcessUTXO(
  candidateWithdrawals: Withdrawal[],
  currency: ICurrency,
  manager: EntityManager
): Promise<IWithdrawlParams> {
  const result = await _pickerDoProcessUTXOExplicit(
    candidateWithdrawals,
    WithdrawOutType.EXPLICIT_FROM_HOT_WALLET,
    currency,
    manager
  );
  if (result) {
    return result;
  }

  // result = _pickerDoProcessUTXOExplicit(
  //   candidateWithdrawals,
  //   WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS,
  //   currency,
  //   manager
  // );
  // if (result) {
  //   return result;
  // }

  return await _pickerDoProcessUTXONormal(candidateWithdrawals, currency, manager);
}

async function _pickerDoProcessUTXOExplicit(
  candidateWithdrawals: Withdrawal[],
  withdrawalType: WithdrawOutType,
  currency: ICurrency,
  manager: EntityManager
): Promise<IWithdrawlParams> {
  const candidateWithdrawalsByType = candidateWithdrawals.filter(w => w.type === withdrawalType);
  if (candidateWithdrawalsByType.length <= 0) {
    return null;
  }

  const fromAddress = candidateWithdrawalsByType[0].fromAddress;

  let isBusy: boolean;
  let senderWallet: HotWallet | Address;
  if (withdrawalType === WithdrawOutType.EXPLICIT_FROM_HOT_WALLET) {
    senderWallet = await rawdb.findHotWalletByAddress(manager, fromAddress);
    isBusy = await rawdb.checkHotWalletIsBusy(
      manager,
      senderWallet,
      [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
      currency
    );
  }
  if (withdrawalType === WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS) {
    senderWallet = await rawdb.findAddress(manager, fromAddress);
    isBusy = await rawdb.checkAddressBusy(manager, fromAddress);
  }
  if (!senderWallet || isBusy) {
    return null;
  }

  let amount = new BigNumber(0);
  const finalPickedWithdrawals = candidateWithdrawalsByType.filter(w => w.fromAddress === fromAddress);
  finalPickedWithdrawals.forEach(withdrawal => {
    const _amount = new BigNumber(withdrawal.amount);
    // Safety check. This case should never happen. But we handle it just in case
    if (_amount.eq(0)) {
      return;
    }
    amount = amount.plus(_amount);
  });
  return {
    senderWallet,
    finalPickedWithdrawals,
    amount,
  };
}

async function _pickerDoProcessUTXONormal(
  candidateWithdrawals: Withdrawal[],
  currency: ICurrency,
  manager: EntityManager
): Promise<IWithdrawlParams> {
  const finalPickedWithdrawals: Withdrawal[] = [];
  let amount = new BigNumber(0);
  finalPickedWithdrawals.push(...candidateWithdrawals.filter(w => w.fromAddress === TMP_ADDRESS));
  finalPickedWithdrawals.forEach(withdrawal => {
    const _amount = new BigNumber(withdrawal.amount);
    // Safety check. This case should never happen. But we handle it just in case
    if (_amount.eq(0)) {
      return;
    }
    amount = amount.plus(_amount);
  });

  let hotWallet: HotWallet;
  if (finalPickedWithdrawals.length) {
    hotWallet = await rawdb.findSufficientHotWallet(
      manager,
      candidateWithdrawals[0].walletId,
      currency,
      amount,
      HotWalletType.Normal
    );
    if (hotWallet) {
      const coldWithdrawals = candidateWithdrawals.filter(w => w.fromAddress === hotWallet.address);
      finalPickedWithdrawals.push(...coldWithdrawals);
      coldWithdrawals.forEach(withdrawal => {
        const _amount = new BigNumber(withdrawal.amount);
        // Safety check. This case should never happen. But we handle it just in case
        if (_amount.eq(0)) {
          return;
        }
        amount = amount.plus(_amount);
      });
      if (!(await rawdb.checkHotWalletIsSufficient(hotWallet, amount))) {
        throw new Error(`Hot wallet is insufficient, check me please!`);
      }
    }
  } else {
    const coldWithdrawals = candidateWithdrawals.filter(w => w.fromAddress !== TMP_ADDRESS);
    for (const coldWithdrawal of coldWithdrawals) {
      hotWallet = await rawdb.findHotWalletByAddress(manager, coldWithdrawal.fromAddress);
      if (
        !(await rawdb.checkHotWalletIsBusy(
          manager,
          hotWallet,
          [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
          currency
        ))
      ) {
        finalPickedWithdrawals.push(coldWithdrawal);
        break;
      }
    }
  }
  // Find an available internal sender wallet
  return {
    senderWallet: hotWallet,
    finalPickedWithdrawals,
    amount,
  };
}

async function _pickerDoProcessAccountBase(
  candidateWithdrawals: Withdrawal[],
  manager: EntityManager
): Promise<IWithdrawlParams> {
  let senderWallet = null;
  const finalPickedWithdrawals = [];
  let amount = new BigNumber(0);
  for (const _candidateWithdrawal of candidateWithdrawals) {
    const currency = CurrencyRegistry.getOneCurrency(_candidateWithdrawal.currency);
    amount = _candidateWithdrawal.getAmount();

    if (_candidateWithdrawal.fromAddress === TMP_ADDRESS) {
      senderWallet = await rawdb.findSufficientHotWallet(
        manager,
        _candidateWithdrawal.walletId,
        currency,
        amount,
        HotWalletType.Normal
      );
      finalPickedWithdrawals.push(_candidateWithdrawal);
      break;
    }

    senderWallet = await rawdb.findHotWalletByAddress(manager, _candidateWithdrawal.fromAddress);
    if (senderWallet) {
      if (
        await rawdb.checkHotWalletIsBusy(
          manager,
          senderWallet,
          [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
          currency
        )
      ) {
        logger.info(`Hot wallet ${senderWallet.address} is busy, dont pick withdrawal collect to cold wallet`);
        continue;
      }
      if (rawdb.checkHotWalletIsSufficient(senderWallet, amount)) {
        finalPickedWithdrawals.push(_candidateWithdrawal);
        break;
      }
    }

    // senderWallet = await rawdb.findAddress(manager, _candidateWithdrawal.fromAddress);
    // if (senderWallet) {
    //   if (await rawdb.checkAddressBusy(manager, _candidateWithdrawal.fromAddress)) {
    //     logger.info(`Deposit address ${senderWallet.address} is busy`);
    //     continue;
    //   }
    //   // TODO: check sufficient deposit address
    //   if (true) {
    //     finalPickedWithdrawals.push(_candidateWithdrawal);
    //     break;
    //   }
    // }
  }

  return {
    senderWallet,
    finalPickedWithdrawals,
    amount,
  };
}

async function _constructRawTransaction(
  currency: ICurrency,
  withdrawlParams: IWithdrawlParams,
  manager: EntityManager
): Promise<IRawTransaction> {
  const vouts: IRawVOut[] = [];
  const finalPickedWithdrawals = withdrawlParams.finalPickedWithdrawals;
  const fromAddress = withdrawlParams.senderWallet;
  const amount = withdrawlParams.amount;
  finalPickedWithdrawals.forEach(withdrawal => {
    vouts.push({
      toAddress: withdrawal.toAddress,
      amount: new BigNumber(withdrawal.amount),
    });
  });
  let unsignedTx: IRawTransaction = null;
  const gateway = GatewayRegistry.getGatewayInstance(currency);
  const withdrawalIds = finalPickedWithdrawals.map(w => w.id);

  try {
    if (currency.isUTXOBased) {
      unsignedTx = await (gateway as UTXOBasedGateway).constructRawTransaction(fromAddress.address, vouts);
    } else {
      const toAddress = vouts[0].toAddress;
      let tag;
      try {
        tag = finalPickedWithdrawals[0].memo || '';
      } catch (e) {
        // do nothing, maybe it's case collect to cold wallet, note is 'from machine'
      }
      unsignedTx = await (gateway as AccountBasedGateway).constructRawTransaction(
        fromAddress.address,
        toAddress,
        amount,
        {
          destinationTag: tag,
        }
      );
    }
    return unsignedTx;
  } catch (err) {
    // Most likely the fail reason is insufficient balance from sender wallet
    // Or there was problem with connection to the full node
    logger.error(
      `Could not create raw tx address=${fromAddress.address}, vouts=${inspect(vouts)}, error=${inspect(err)}`
    );

    // update withdrawal record
    await rawdb.updateRecordsTimestamp(manager, Withdrawal, withdrawalIds);
    return null;
  }
}

export default pickerDoProcess;
