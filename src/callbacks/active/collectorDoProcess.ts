// TODO: Revive me
export async function collectorDoProcess() {
  // Do nothing
}

// import {
//   getLogger,
//   BaseDepositCollector,
//   Utils,
//   getListTokenSymbols,
//   getMinimumDepositAmount,
//   getCurrencyDecimal,
//   getFamily,
//   IWithdrawalProcessingResult,
//   getCurrency,
//   ISignedRawTransaction,
//   Errors,
// } from 'sota-common';
// import BN from 'bignumber.js';
// import { EntityManager, getConnection, In } from 'typeorm';
// import * as rawdb from '../../rawdb';
// import { CollectStatus, InternalTransferType, WithdrawalStatus } from '../../Enums';
// import { Deposit, Address, InternalTransfer, HotWallet } from '../../entities';
// import Kms from '../../encrypt/Kms';
// import _ = require('lodash');

// const logger = getLogger('collectorDoProcess');

// const emptyResult: IWithdrawalCollectingResult = {
//   deposits: [],
//   satisfiedDeposits: [],
//   rawTransaction: null,
//   receiver: null,
//   needNextProcess: false,
//   withdrawalTxId: null,
// };

// interface IWithdrawalCollectingResult extends IWithdrawalProcessingResult {
//   receiver: string;
//   deposits: Deposit[];
//   satisfiedDeposits: Deposit[];
//   rawTransaction: string;
// }

// interface IForwardingInputs {
//   addresses: string | string[];
//   privateKeys: string | string[];
//   satisfiedDeposits: Deposit[];
// }

// interface IDepositsTotalAmount {
//   ok: boolean;
//   totalDepositAmount: string;
// }

// export async function collectorDoProcess(collector: BaseDepositCollector): Promise<IWithdrawalCollectingResult> {
//   let doProcessResult: IWithdrawalCollectingResult = null;
//   await getConnection().transaction(async manager => {
//     doProcessResult = await _collectorDoProcess(manager, collector);
//   });

//   await getConnection().transaction(async manager => {
//     await _collectorSubmitProcess(manager, collector, doProcessResult);
//   });
//   return doProcessResult;
// }

// /**
//  * Picker do process
//  * @param manager
//  * @param picker
//  * @private
//  */
// async function _collectorDoProcess(
//   manager: EntityManager,
//   collector: BaseDepositCollector
// ): Promise<IWithdrawalCollectingResult> {
//   const currencyGateway = collector.getGateway(getCurrency());
//   const unCollectedDeposits = await rawdb.findDepositsByCollectStatus(
//     manager,
//     getListTokenSymbols().tokenSymbols,
//     [CollectStatus.UNCOLLECTED],
//     currencyGateway.getTransferType()
//   );
//   if (!unCollectedDeposits.length) {
//     logger.info(`There're no uncollected deposit right now. Will try to process later...`);
//     return emptyResult;
//   }

//   const result = await _collectDepositTransaction(manager, collector, unCollectedDeposits);
//   return result;
// }

// /**
//  * Picker do process
//  * @param manager
//  * @param picker
//  * @private
//  */
// async function _collectorSubmitProcess(
//   manager: EntityManager,
//   collector: BaseDepositCollector,
//   doProcessResult: IWithdrawalCollectingResult
// ): Promise<void> {
//   if (doProcessResult === emptyResult) {
//     return;
//   }
//   const depositCurrency = doProcessResult.deposits[0].currency;
//   const collectTxId = doProcessResult.deposits[0].collectedTxid;
//   const walletId = doProcessResult.deposits[0].walletId;
//   const gateway = collector.getGateway(depositCurrency);

//   try {
//     await gateway.sendRawTransaction(doProcessResult.rawTransaction);
//   } catch (e) {
//     logger.error(
//       `Can not send transaction txid=${doProcessResult.satisfiedDeposits[0].collectedTxid}, address=${
//         doProcessResult.deposits[0].toAddress
//       }.`
//     );
//     logger.error(`===============================`);
//     logger.error(e);
//     logger.error(`===============================`);
//   }
//   // after sent, update status to collecting
//   const satisfiedDeposit = doProcessResult.satisfiedDeposits;
//   satisfiedDeposit.forEach(deposit => {
//     deposit.collectStatus = CollectStatus.COLLECTING;
//     deposit.updatedAt = Utils.nowInMillis();
//   });

//   const internalTransferRecord = new InternalTransfer();
//   internalTransferRecord.currency = depositCurrency;
//   internalTransferRecord.txid = collectTxId;
//   internalTransferRecord.walletId = walletId;
//   internalTransferRecord.type = InternalTransferType.COLLECT;
//   internalTransferRecord.status = WithdrawalStatus.SENT;
//   internalTransferRecord.fromAddress = 'will remove this field';
//   internalTransferRecord.toAddress = 'will remove this field';

//   await Utils.PromiseAll([manager.save(internalTransferRecord), manager.save(satisfiedDeposit)]);
//   return;
// }

// /**
//  * Try to collect funds from many deposits to the hot wallet
//  *
//  * @param manager
//  * @param collector
//  * @param deposits
//  */
// async function _collectDepositTransaction(
//   manager: EntityManager,
//   collector: BaseDepositCollector,
//   deposits: Deposit[]
// ): Promise<IWithdrawalCollectingResult> {
//   const currency = getFamily();
//   const depositCurrency = deposits[0].currency;
//   const walletId = deposits[0].walletId;
//   const gateway = collector.getGateway(depositCurrency);

//   const checkDepositAmounts = await _checkDepositAmount(manager, deposits);
//   let satisfyDeposit: Deposit[] = [];
//   let unsatisfyDeposit: Deposit[] = [];
//   let forwardResult: ISignedRawTransaction;
//   let hotWallet: HotWallet;

//   // pre-checking
//   if (checkDepositAmounts.ok) {
//     const forwardInputs = await _getForwardingInputs(manager, deposits);
//     satisfyDeposit = forwardInputs.satisfiedDeposits;
//     unsatisfyDeposit = _.difference(deposits, satisfyDeposit);

//     // TODO: What's the right way to find hot wallet?
//     hotWallet = await rawdb.findAnyHotWallet(manager, walletId, currency, false);
//     if (hotWallet) {
//       logger.info(`${currency} internal hot wallet is available, internal mode`);
//     } else {
//       logger.info(`${currency} internal hot wallet is not available, external mode`);
//       hotWallet = await rawdb.findAnyHotWallet(manager, walletId, currency, true);
//     }

//     if (hotWallet) {
//       try {
//         forwardResult = await gateway.forwardTransaction(
//           forwardInputs.privateKeys,
//           forwardInputs.addresses,
//           hotWallet.address,
//           checkDepositAmounts.totalDepositAmount,
//           satisfyDeposit.map(deposit => deposit.txid)
//         );
//       } catch (e) {
//         if (e.code && e.code === Errors.notEnoughFeeError.code) {
//           await Promise.all(
//             satisfyDeposit.map(async deposit => {
//               await collector.emitMessage(`seed,${deposit.id},${deposit.toAddress}`);
//             })
//           );
//           return emptyResult;
//         } else {
//           throw e;
//         }
//       }
//     }
//   }

//   unsatisfyDeposit.forEach(deposit => {
//     deposit.collectStatus = CollectStatus.NOTCOLLECT;
//     deposit.collectedTxid = 'INVALID_ADDRESS';
//     deposit.updatedAt = Utils.nowInMillis();
//   });
//   satisfyDeposit.forEach(deposit => {
//     if (forwardResult) {
//       // MAKE SURE DEPOSIT WILL BE NOT RESENT, IF TRANSACTION SENT BUT IT IS NOT UPDATED STATUS TO COLLECTING
//       deposit.collectStatus = CollectStatus.COLLECTING_FORWARDING;
//       deposit.collectedTxid = forwardResult.txid;
//     }
//     deposit.updatedAt = Utils.nowInMillis();
//   });

//   await Utils.PromiseAll([manager.save(satisfyDeposit), manager.save(unsatisfyDeposit)]);

//   return forwardResult
//     ? {
//         deposits,
//         satisfiedDeposits: satisfyDeposit,
//         rawTransaction: forwardResult.signedRaw,
//         needNextProcess: true,
//         withdrawalTxId: 0,
//         receiver: hotWallet.address,
//       }
//     : emptyResult;
// }

// /**
//  * Check total amount of deposit records with set minimum deposit amount
//  * @param manager
//  * @param collector
//  * @param deposits
//  * @private
//  */
// async function _checkDepositAmount(manager: EntityManager, deposits: Deposit[]): Promise<IDepositsTotalAmount> {
//   let amountNumber = new BN(0);
//   deposits.forEach(deposit => {
//     amountNumber = amountNumber.plus(new BN(deposit.amount));
//   });
//   const depositCurrency = deposits[0].currency;
//   const minimumDepositAmount = getMinimumDepositAmount(depositCurrency);
//   if (!minimumDepositAmount) {
//     logger.error(`Minimum deposit is not setted for ${depositCurrency}`);
//     return {
//       ok: false,
//       totalDepositAmount: amountNumber.toString(),
//     };
//   }

//   const factor = new BN(10).pow(getCurrencyDecimal(depositCurrency));
//   const minNumber = new BN(minimumDepositAmount).multipliedBy(factor);

//   if (amountNumber.lt(minNumber)) {
//     logger.warn(
//       `Deposit amount less than threshold` +
//         ` depositId=${deposits.map(deposit => deposit.id)}` +
//         ` currency=${deposits[0].currency}` +
//         ` amount=${amountNumber.toString()} < threshold=${minNumber}`
//     );
//     deposits.forEach(deposit => {
//       deposit.updatedAt = Utils.nowInMillis();
//       deposit.collectedTxid = 'AMOUNT_BELOW_THRESHOLD';
//     });
//     await manager.getRepository(Deposit).save(deposits);
//     return {
//       ok: false,
//       totalDepositAmount: amountNumber.toString(),
//     };
//   }
//   return {
//     ok: true,
//     totalDepositAmount: amountNumber.toString(),
//   };
// }

// /**
//  * Get list sender addresses and private keys to forward transaction
//  * @param manager
//  * @param collector
//  * @param deposits
//  * @private
//  */
// async function _getForwardingInputs(manager: EntityManager, deposits: Deposit[]): Promise<IForwardingInputs> {
//   const depositAddress = deposits.map(deposit => deposit.toAddress);
//   const uniqueDepositAddress: string[] = Array.from(new Set(depositAddress.map((addr: string) => addr)));

//   // get list address
//   const addresses = await manager.getRepository(Address).find({ address: In(uniqueDepositAddress), isExternal: 0 });

//   const stringAddrs: string[] = addresses.map(addr => addr.address);
//   const privateKeys: string[] = [];

//   await Promise.all(
//     addresses.map(async addr => {
//       let privateKey: string = null;
//       let kmsDataKeyId: number;

//       try {
//         const privateKeyDef = JSON.parse(addr.secret);
//         privateKey = privateKeyDef.private_key;
//         kmsDataKeyId = privateKeyDef.kms_data_key_id;

//         if (kmsDataKeyId !== 0) {
//           privateKey = await Kms.getInstance().decrypt(privateKey, kmsDataKeyId);
//         }
//       } catch (e) {
//         privateKey = addr.secret;
//       }

//       privateKeys.push(privateKey);
//     })
//   );

//   const satisfiedDeposits = deposits.filter(deposit => stringAddrs.indexOf(deposit.toAddress) !== -1);
//   return {
//     addresses: addresses.length === 1 ? addresses[0].address : stringAddrs,
//     privateKeys: privateKeys.length === 1 ? privateKeys[0] : privateKeys,
//     satisfiedDeposits,
//   };
// }

// export default collectorDoProcess;
