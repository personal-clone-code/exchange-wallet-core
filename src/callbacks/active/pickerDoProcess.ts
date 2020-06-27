import _ from 'lodash';
import { EntityManager, getConnection, In } from 'typeorm';
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
  Utils,
  BitcoinBasedGateway,
  IInsightUtxoInfo,
  IBoiledVOut,
  BaseGateway,
  IToken,
} from 'sota-common';
import { Withdrawal, HotWallet, Address, Deposit, MaxFee } from '../../entities';
import { inspect } from 'util';
import * as rawdb from '../../rawdb';
import { WithdrawalStatus, WithdrawOutType, LocalTxType, SettingKey } from '../../Enums';
import { _constructUtxoBasedCollectTx } from '..';

const logger = getLogger('pickerDoProcess');
const TMP_ADDRESS = 'TMP_ADDRESS';
let failedCounter = 0;

interface IWithdrawlParams {
  senderWallet: HotWallet | Address;
  finalPickedWithdrawals: Withdrawal[];
  amount: BigNumber;
}
interface INetworkFee {
  gasLimit: number;
  gasPrice: number;
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

  // check max_fee vs fee_threshold
  const checkFee = await checkMaxFee(manager, currency);
  if (!checkFee) {
    return;
  }

  let withdrawlParams: IWithdrawlParams;
  if (currency.isUTXOBased) {
    withdrawlParams = await _pickerDoProcessUTXO(candidateWithdrawals, currency, manager);
  } else {
    withdrawlParams = await _pickerDoProcessAccountBase(candidateWithdrawals, manager);
  }
  if (!withdrawlParams) {
    logger.info(`Dont have suitable withdrawl record to pick withdrawlParams is ${withdrawlParams}`);
    return;
  }
  const finalPickedWithdrawals: Withdrawal[] = withdrawlParams.finalPickedWithdrawals;
  if (!finalPickedWithdrawals.length) {
    logger.info(`Dont have suitable withdrawl record to pick, finalPickedWithdrawals is emty`);
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
  const type =
    finalPickedWithdrawals[0].type === WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS
      ? LocalTxType.WITHDRAWAL_COLLECT
      : LocalTxType.WITHDRAWAL_NORMAL;
  // Create withdrawal tx record
  try {
    await rawdb.doPickingWithdrawals(
      manager,
      unsignedTx,
      senderWallet,
      currency.symbol,
      finalPickedWithdrawals,
      type
      // withdrawlParams.amount
    );
  } catch (e) {
    logger.error(`Could not finish picking withdrawal ids=[${withdrawalIds}] err=${e.toString()}`);
    throw e;
  }

  return;
}

async function _pickerDoProcessUTXO(
  candidateWithdrawals: Withdrawal[],
  currency: ICurrency,
  manager: EntityManager
): Promise<IWithdrawlParams> {
  const result3 = await _pickerDoProcessUTXOExplicit(
    candidateWithdrawals,
    WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS,
    currency,
    manager
  );
  if (result3) {
    return result3;
  }

  const result2 = await _pickerDoProcessUTXOExplicit(
    candidateWithdrawals,
    WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS,
    currency,
    manager
  );
  if (result2) {
    return result2;
  }

  return await _pickerDoProcessUTXONormal(candidateWithdrawals, currency, manager);
}

async function _pickerDoProcessUTXOExplicit(
  candidateWithdrawals: Withdrawal[],
  withdrawalType: WithdrawOutType,
  currency: ICurrency,
  manager: EntityManager
): Promise<IWithdrawlParams> {
  logger.info(`Pick case Collect UTXO`);
  const candidateWithdrawalsByType = candidateWithdrawals.filter(w => w.type === withdrawalType);
  if (candidateWithdrawalsByType.length <= 0) {
    logger.info(`Dont have withdrawal case Collect UTXO`);
    return null;
  }

  const fromAddress = candidateWithdrawalsByType[0].fromAddress;

  const senderWallet: HotWallet | Address = await rawdb.findAddress(manager, fromAddress);
  const isBusy: boolean = await rawdb.checkAddressBusy(manager, fromAddress);

  if (!senderWallet || isBusy) {
    logger.info(`${senderWallet} is not exist or has busy state: ${isBusy}`);
    return null;
  }

  let amount = new BigNumber(0);
  const finalPickedWithdrawals = candidateWithdrawalsByType.filter(w => w.fromAddress === fromAddress);
  finalPickedWithdrawals.forEach(withdrawal => {
    const _amount = new BigNumber(withdrawal.amount);
    // Safety check. This case should never happen. But we handle it just in case
    if (_amount.eq(0)) {
      logger.info(`amount ${_amount} is less than 0`);
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
  logger.info(`Pick case Normal UTXO`);
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
      if (!(await rawdb.checkHotWalletIsSufficient(hotWallet, currency, amount))) {
        throw new Error(`Hot wallet is insufficient, check me please!`);
      }
    }
  } else {
    const coldWithdrawals = candidateWithdrawals.filter(
      w =>
        w.type === WithdrawOutType.EXPLICIT_FROM_HOT_WALLET || w.type.endsWith(WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX)
    );
    for (const coldWithdrawal of coldWithdrawals) {
      hotWallet = await rawdb.findHotWalletByAddress(manager, coldWithdrawal.fromAddress);
      if (hotWallet) {
        if (
          !(await rawdb.checkHotWalletIsBusy(
            manager,
            hotWallet,
            [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
            currency.platform
          ))
        ) {
          finalPickedWithdrawals.push(coldWithdrawal);
          break;
        }
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
    if (
      _candidateWithdrawal.type === WithdrawOutType.EXPLICIT_FROM_HOT_WALLET ||
      _candidateWithdrawal.type.endsWith(WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX)
    ) {
      senderWallet = await rawdb.findHotWalletByAddress(manager, _candidateWithdrawal.fromAddress);
      if (senderWallet) {
        if (
          await rawdb.checkHotWalletIsBusy(
            manager,
            senderWallet,
            [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
            currency.platform
          )
        ) {
          logger.info(`Hot wallet ${senderWallet.address} is busy, dont pick withdrawal collect to cold wallet`);
          continue;
        }
        if (rawdb.checkHotWalletIsSufficient(senderWallet, currency, amount)) {
          finalPickedWithdrawals.push(_candidateWithdrawal);
          break;
        }
      }
    } else if (
      _candidateWithdrawal.type === WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS ||
      _candidateWithdrawal.type === WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS
    ) {
      senderWallet = await rawdb.findAddress(manager, _candidateWithdrawal.fromAddress);
      if (senderWallet) {
        if (
          await rawdb.checkAddressIsBusy(
            manager,
            senderWallet,
            [WithdrawalStatus.SIGNING, WithdrawalStatus.SIGNED, WithdrawalStatus.SENT],
            currency.platform
          )
        ) {
          logger.info(`Deposit address ${senderWallet.address} is busy`);
          continue;
        }
        // TODO: check sufficient deposit address
        if (await rawdb.checkAddressIsSufficient(senderWallet, currency, amount)) {
          finalPickedWithdrawals.push(_candidateWithdrawal);
          break;
        }
      }
    } else {
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
      if (
        finalPickedWithdrawals[0].type !== WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS &&
        finalPickedWithdrawals[0].type !== WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS
      ) {
        logger.info(`picking withdrawal record case UTXO and withdraw from hot wallet`);
        unsignedTx = await (gateway as UTXOBasedGateway).constructRawTransaction(fromAddress.address, vouts);
      } else {
        logger.info(`picking withdrawal record case UTXO collect`);
        const deposits = await manager.getRepository(Deposit).find({
          where: {
            collectWithdrawalId: In(finalPickedWithdrawals.map(w => w.id)),
          },
        });
        unsignedTx = await _constructUtxoBasedCollectTx(deposits, finalPickedWithdrawals[0].toAddress);
      }
    } else {
      const toAddress = vouts[0].toAddress;
      let tag;
      try {
        tag = finalPickedWithdrawals[0].memo || '';
      } catch (e) {
        // do nothing, maybe it's case collect to cold wallet, note is 'from machine'
      }
      if (
        (finalPickedWithdrawals[0] &&
          finalPickedWithdrawals[0].type === WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS) ||
        finalPickedWithdrawals[0].type === WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS
      ) {
        logger.info(`picking withdrawal record case Account Base collect`);
        unsignedTx = await (gateway as AccountBasedGateway).constructRawTransaction(
          fromAddress.address,
          toAddress,
          amount,
          {
            destinationTag: tag,
            isConsolidate: currency.isNative,
          }
        );
      } else {
        logger.info(`picking withdrawal record case Account Base normal`);
        let options: any = {
          destinationTag: tag,
        };
        const explicitNetworkFee = await handleNetworkFee(manager, gateway, currency);
        if (explicitNetworkFee) {
          options.explicitGasPrice = explicitNetworkFee.gasPrice;
          options.explicitGasLimit = explicitNetworkFee.gasLimit;
        }
        unsignedTx = await (gateway as AccountBasedGateway).constructRawTransaction(
          fromAddress.address,
          toAddress,
          amount,
          options,
        );
      }
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

/**
 * This logic just handle to Ethreum platform.
 * If this one is expanded for other platforms, `fee_threshold` should be setting in `currency` instead of `setting` table.
 * Tasks of handle network fee:
 * - find in `setting` table to get fee_threshold
 * - get estimate fee at process time
 * - if setting is not found or `setting.value` = '0' => handle network fee as normal
 * - else if estimate fee is less than or equal to fee threshold setting => handle network fee as normal
 * - the other cases, network fee = fee threshold setting
 * @param manager
 * @param gateway
 * @param currency
 */
async function handleNetworkFee(
    manager: EntityManager,
    gateway: BaseGateway,
    currency: ICurrency,
  ): Promise<INetworkFee> {
  const setting = await rawdb.findSettingByKey(manager, SettingKey.ETH_FEE_THRESHOLD.toUpperCase());
  if (!setting || setting.value === '0') {
    logger.info(`Network fee threshold is not set. Handle network fee as normal.`);
    return null;
  }
  const feeThreshold = new BigNumber(setting.value);

  const estimateFee = await gateway.estimateFee({
    isConsolidate: currency.isNative,
  });

  if (estimateFee.lte(feeThreshold)) {
    logger.info(`Estimate fee = ${estimateFee} is less than or equal fee_threshold setting = ${feeThreshold} => Use estimate fee.`);
    return null;
  }

  // fixed gasLimit is maximum value to process Ethreum transaction
  const gasLimit = 150000;
  const gasPrice = feeThreshold.div(gasLimit).integerValue().toNumber();
  logger.info(`Estimate fee = ${estimateFee} is greater than fee_threshold setting = ${feeThreshold}. Gas limit = ${gasLimit}, gas price = ${gasPrice}`)
  return {
    gasLimit,
    gasPrice,
  }
}

/**
 * Tasks of checkMaxFee:
 * - Get max fee by usd on setting
 * - Get current max fee (calculated according to the fomula: current price eth * current estimate fee)
 * - if current max fee greater than max fee setting => pending all withdrawals
 * @param manager
 * @param currency
 */
async function checkMaxFee(
  manager: EntityManager,
  currency: ICurrency,
): Promise<boolean> {
  const maxFeeSetting = await rawdb.findSettingByKey(manager, SettingKey.MAX_FEE_BY_USD.toUpperCase());
  if (!maxFeeSetting) {
    logger.info(`Max fee by usd is not set. Handle network fee as normal.`)
    return true;
  }
  const maxFeeByUsdSetting = new BigNumber(maxFeeSetting.value);

  const maxFee = await manager.getRepository(MaxFee).findOne({
    order: {
      updatedAt: 'DESC',
    },
    where: {
      currency: currency.isNative? currency.platform : (currency as IToken).tokenType,
    },
  });
  if (!maxFee) {
    throw new Error(`EthPickerDoProcess: Database has no max fee records. Please check maxFeeDoProcess`);
  }
  // price every 5 minutes 1 time
  if (Date.now() - maxFee.updatedAt > 300000) {
    throw new Error(`EthPickerDoProcess: The lastest maxFee record is old. Please check maxFeeDoProcess`)
  }

  if (new BigNumber(maxFee.feeByUsd).gt(maxFeeByUsdSetting)) {
    logger.warn(`PickerDoProcess will suspend all withdrawals because max_fee_by_usd in setting = ${maxFeeByUsdSetting} less than current max_fee = ${maxFee.feeByUsd}`);
    return false;
  }

  return true;
}

export default pickerDoProcess;
