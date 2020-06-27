"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var entities_1 = require("../../entities");
var util_1 = require("util");
var rawdb = __importStar(require("../../rawdb"));
var Enums_1 = require("../../Enums");
var __1 = require("..");
var logger = sota_common_1.getLogger('pickerDoProcess');
var TMP_ADDRESS = 'TMP_ADDRESS';
var failedCounter = 0;
function pickerDoProcess(picker) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _pickerDoProcess(manager, picker)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.pickerDoProcess = pickerDoProcess;
function _pickerDoProcess(manager, picker) {
    return __awaiter(this, void 0, void 0, function () {
        var iCurrency, candidateWithdrawals, walletId, symbol, currency, checkFee, withdrawlParams, finalPickedWithdrawals, senderWallet, withdrawalIds, unsignedTx, type, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    iCurrency = picker.getCurrency();
                    return [4, rawdb.getNextPickedWithdrawals(manager, iCurrency.platform)];
                case 1:
                    candidateWithdrawals = _a.sent();
                    if (!(!candidateWithdrawals || candidateWithdrawals.length === 0)) return [3, 3];
                    logger.info("No more withdrawal need to be picked up. Will check upperthreshold sender wallet the next tick...");
                    return [4, rawdb.checkUpperThreshold(manager, iCurrency.platform)];
                case 2:
                    _a.sent();
                    return [2];
                case 3:
                    walletId = candidateWithdrawals[0].walletId;
                    symbol = candidateWithdrawals[0].currency;
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(symbol);
                    return [4, checkMaxFee(manager, currency)];
                case 4:
                    checkFee = _a.sent();
                    if (!checkFee) {
                        return [2];
                    }
                    if (!currency.isUTXOBased) return [3, 6];
                    return [4, _pickerDoProcessUTXO(candidateWithdrawals, currency, manager)];
                case 5:
                    withdrawlParams = _a.sent();
                    return [3, 8];
                case 6: return [4, _pickerDoProcessAccountBase(candidateWithdrawals, manager)];
                case 7:
                    withdrawlParams = _a.sent();
                    _a.label = 8;
                case 8:
                    if (!withdrawlParams) {
                        logger.info("Dont have suitable withdrawl record to pick withdrawlParams is " + withdrawlParams);
                        return [2];
                    }
                    finalPickedWithdrawals = withdrawlParams.finalPickedWithdrawals;
                    if (!finalPickedWithdrawals.length) {
                        logger.info("Dont have suitable withdrawl record to pick, finalPickedWithdrawals is emty");
                        return [2];
                    }
                    senderWallet = withdrawlParams.senderWallet;
                    withdrawalIds = finalPickedWithdrawals.map(function (w) { return w.id; });
                    if (!!senderWallet) return [3, 10];
                    failedCounter += 1;
                    if (failedCounter % 50 === 0) {
                        logger.error("No available sender wallet walletId=" + walletId + " currency=" + currency + " failedCounter=" + failedCounter);
                    }
                    else {
                        logger.info("No available sender wallet at the moment: walletId=" + walletId + " currency=" + currency);
                    }
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Withdrawal, withdrawalIds)];
                case 9:
                    _a.sent();
                    return [2];
                case 10:
                    failedCounter = 0;
                    return [4, _constructRawTransaction(currency, withdrawlParams, manager)];
                case 11:
                    unsignedTx = _a.sent();
                    if (!!unsignedTx) return [3, 13];
                    logger.error("Could not construct unsigned tx. Just wait until the next tick...");
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Withdrawal, withdrawalIds)];
                case 12:
                    _a.sent();
                    return [2];
                case 13:
                    type = finalPickedWithdrawals[0].type === Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS
                        ? Enums_1.LocalTxType.WITHDRAWAL_COLLECT
                        : Enums_1.LocalTxType.WITHDRAWAL_NORMAL;
                    _a.label = 14;
                case 14:
                    _a.trys.push([14, 16, , 17]);
                    return [4, rawdb.doPickingWithdrawals(manager, unsignedTx, senderWallet, currency.symbol, finalPickedWithdrawals, type)];
                case 15:
                    _a.sent();
                    return [3, 17];
                case 16:
                    e_1 = _a.sent();
                    logger.fatal("Could not finish picking withdrawal ids=[" + withdrawalIds + "] err=" + e_1.toString());
                    throw e_1;
                case 17: return [2];
            }
        });
    });
}
function _pickerDoProcessUTXO(candidateWithdrawals, currency, manager) {
    return __awaiter(this, void 0, void 0, function () {
        var result3, result2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, _pickerDoProcessUTXOExplicit(candidateWithdrawals, Enums_1.WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS, currency, manager)];
                case 1:
                    result3 = _a.sent();
                    if (result3) {
                        return [2, result3];
                    }
                    return [4, _pickerDoProcessUTXOExplicit(candidateWithdrawals, Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS, currency, manager)];
                case 2:
                    result2 = _a.sent();
                    if (result2) {
                        return [2, result2];
                    }
                    return [4, _pickerDoProcessUTXONormal(candidateWithdrawals, currency, manager)];
                case 3: return [2, _a.sent()];
            }
        });
    });
}
function _pickerDoProcessUTXOExplicit(candidateWithdrawals, withdrawalType, currency, manager) {
    return __awaiter(this, void 0, void 0, function () {
        var candidateWithdrawalsByType, fromAddress, senderWallet, isBusy, amount, finalPickedWithdrawals;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info("Pick case Collect UTXO");
                    candidateWithdrawalsByType = candidateWithdrawals.filter(function (w) { return w.type === withdrawalType; });
                    if (candidateWithdrawalsByType.length <= 0) {
                        logger.info("Dont have withdrawal case Collect UTXO");
                        return [2, null];
                    }
                    fromAddress = candidateWithdrawalsByType[0].fromAddress;
                    return [4, rawdb.findAddress(manager, fromAddress)];
                case 1:
                    senderWallet = _a.sent();
                    return [4, rawdb.checkAddressBusy(manager, fromAddress)];
                case 2:
                    isBusy = _a.sent();
                    if (!senderWallet || isBusy) {
                        logger.info(senderWallet + " is not exist or has busy state: " + isBusy);
                        return [2, null];
                    }
                    amount = new sota_common_1.BigNumber(0);
                    finalPickedWithdrawals = candidateWithdrawalsByType.filter(function (w) { return w.fromAddress === fromAddress; });
                    finalPickedWithdrawals.forEach(function (withdrawal) {
                        var _amount = new sota_common_1.BigNumber(withdrawal.amount);
                        if (_amount.eq(0)) {
                            logger.info("amount " + _amount + " is less than 0");
                            return;
                        }
                        amount = amount.plus(_amount);
                    });
                    return [2, {
                            senderWallet: senderWallet,
                            finalPickedWithdrawals: finalPickedWithdrawals,
                            amount: amount,
                        }];
            }
        });
    });
}
function _pickerDoProcessUTXONormal(candidateWithdrawals, currency, manager) {
    return __awaiter(this, void 0, void 0, function () {
        var finalPickedWithdrawals, amount, hotWallet, coldWithdrawals, coldWithdrawals, _i, coldWithdrawals_1, coldWithdrawal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info("Pick case Normal UTXO");
                    finalPickedWithdrawals = [];
                    amount = new sota_common_1.BigNumber(0);
                    finalPickedWithdrawals.push.apply(finalPickedWithdrawals, candidateWithdrawals.filter(function (w) { return w.fromAddress === TMP_ADDRESS; }));
                    finalPickedWithdrawals.forEach(function (withdrawal) {
                        var _amount = new sota_common_1.BigNumber(withdrawal.amount);
                        if (_amount.eq(0)) {
                            return;
                        }
                        amount = amount.plus(_amount);
                    });
                    if (!finalPickedWithdrawals.length) return [3, 4];
                    return [4, rawdb.findSufficientHotWallet(manager, candidateWithdrawals[0].walletId, currency, amount, sota_common_1.HotWalletType.Normal)];
                case 1:
                    hotWallet = _a.sent();
                    if (!hotWallet) return [3, 3];
                    coldWithdrawals = candidateWithdrawals.filter(function (w) { return w.fromAddress === hotWallet.address; });
                    finalPickedWithdrawals.push.apply(finalPickedWithdrawals, coldWithdrawals);
                    coldWithdrawals.forEach(function (withdrawal) {
                        var _amount = new sota_common_1.BigNumber(withdrawal.amount);
                        if (_amount.eq(0)) {
                            return;
                        }
                        amount = amount.plus(_amount);
                    });
                    return [4, rawdb.checkHotWalletIsSufficient(hotWallet, currency, amount)];
                case 2:
                    if (!(_a.sent())) {
                        throw new Error("Hot wallet is insufficient, check me please!");
                    }
                    _a.label = 3;
                case 3: return [3, 9];
                case 4:
                    coldWithdrawals = candidateWithdrawals.filter(function (w) {
                        return w.type === Enums_1.WithdrawOutType.EXPLICIT_FROM_HOT_WALLET || w.type.endsWith(Enums_1.WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX);
                    });
                    _i = 0, coldWithdrawals_1 = coldWithdrawals;
                    _a.label = 5;
                case 5:
                    if (!(_i < coldWithdrawals_1.length)) return [3, 9];
                    coldWithdrawal = coldWithdrawals_1[_i];
                    return [4, rawdb.findHotWalletByAddress(manager, coldWithdrawal.fromAddress)];
                case 6:
                    hotWallet = _a.sent();
                    if (!hotWallet) return [3, 8];
                    return [4, rawdb.checkHotWalletIsBusy(manager, hotWallet, [Enums_1.WithdrawalStatus.SIGNING, Enums_1.WithdrawalStatus.SIGNED, Enums_1.WithdrawalStatus.SENT], currency.platform)];
                case 7:
                    if (!(_a.sent())) {
                        finalPickedWithdrawals.push(coldWithdrawal);
                        return [3, 9];
                    }
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3, 5];
                case 9: return [2, {
                        senderWallet: hotWallet,
                        finalPickedWithdrawals: finalPickedWithdrawals,
                        amount: amount,
                    }];
            }
        });
    });
}
function _pickerDoProcessAccountBase(candidateWithdrawals, manager) {
    return __awaiter(this, void 0, void 0, function () {
        var senderWallet, finalPickedWithdrawals, amount, _i, candidateWithdrawals_1, _candidateWithdrawal, currency;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    senderWallet = null;
                    finalPickedWithdrawals = [];
                    amount = new sota_common_1.BigNumber(0);
                    _i = 0, candidateWithdrawals_1 = candidateWithdrawals;
                    _a.label = 1;
                case 1:
                    if (!(_i < candidateWithdrawals_1.length)) return [3, 13];
                    _candidateWithdrawal = candidateWithdrawals_1[_i];
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(_candidateWithdrawal.currency);
                    amount = _candidateWithdrawal.getAmount();
                    if (!(_candidateWithdrawal.type === Enums_1.WithdrawOutType.EXPLICIT_FROM_HOT_WALLET ||
                        _candidateWithdrawal.type.endsWith(Enums_1.WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX))) return [3, 5];
                    return [4, rawdb.findHotWalletByAddress(manager, _candidateWithdrawal.fromAddress)];
                case 2:
                    senderWallet = _a.sent();
                    if (!senderWallet) return [3, 4];
                    return [4, rawdb.checkHotWalletIsBusy(manager, senderWallet, [Enums_1.WithdrawalStatus.SIGNING, Enums_1.WithdrawalStatus.SIGNED, Enums_1.WithdrawalStatus.SENT], currency.platform)];
                case 3:
                    if (_a.sent()) {
                        logger.info("Hot wallet " + senderWallet.address + " is busy, dont pick withdrawal collect to cold wallet");
                        return [3, 12];
                    }
                    if (rawdb.checkHotWalletIsSufficient(senderWallet, currency, amount)) {
                        finalPickedWithdrawals.push(_candidateWithdrawal);
                        return [3, 13];
                    }
                    _a.label = 4;
                case 4: return [3, 12];
                case 5:
                    if (!(_candidateWithdrawal.type === Enums_1.WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS ||
                        _candidateWithdrawal.type === Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS)) return [3, 10];
                    return [4, rawdb.findAddress(manager, _candidateWithdrawal.fromAddress)];
                case 6:
                    senderWallet = _a.sent();
                    if (!senderWallet) return [3, 9];
                    return [4, rawdb.checkAddressIsBusy(manager, senderWallet, [Enums_1.WithdrawalStatus.SIGNING, Enums_1.WithdrawalStatus.SIGNED, Enums_1.WithdrawalStatus.SENT], currency.platform)];
                case 7:
                    if (_a.sent()) {
                        logger.info("Deposit address " + senderWallet.address + " is busy");
                        return [3, 12];
                    }
                    return [4, rawdb.checkAddressIsSufficient(senderWallet, currency, amount)];
                case 8:
                    if (_a.sent()) {
                        finalPickedWithdrawals.push(_candidateWithdrawal);
                        return [3, 13];
                    }
                    _a.label = 9;
                case 9: return [3, 12];
                case 10: return [4, rawdb.findSufficientHotWallet(manager, _candidateWithdrawal.walletId, currency, amount, sota_common_1.HotWalletType.Normal)];
                case 11:
                    senderWallet = _a.sent();
                    finalPickedWithdrawals.push(_candidateWithdrawal);
                    return [3, 13];
                case 12:
                    _i++;
                    return [3, 1];
                case 13: return [2, {
                        senderWallet: senderWallet,
                        finalPickedWithdrawals: finalPickedWithdrawals,
                        amount: amount,
                    }];
            }
        });
    });
}
function _constructRawTransaction(currency, withdrawlParams, manager) {
    return __awaiter(this, void 0, void 0, function () {
        var vouts, finalPickedWithdrawals, fromAddress, amount, unsignedTx, gateway, withdrawalIds, deposits, toAddress, tag, options, explicitNetworkFee, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vouts = [];
                    finalPickedWithdrawals = withdrawlParams.finalPickedWithdrawals;
                    fromAddress = withdrawlParams.senderWallet;
                    amount = withdrawlParams.amount;
                    finalPickedWithdrawals.forEach(function (withdrawal) {
                        vouts.push({
                            toAddress: withdrawal.toAddress,
                            amount: new sota_common_1.BigNumber(withdrawal.amount),
                        });
                    });
                    unsignedTx = null;
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    withdrawalIds = finalPickedWithdrawals.map(function (w) { return w.id; });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 13, , 15]);
                    if (!currency.isUTXOBased) return [3, 7];
                    if (!(finalPickedWithdrawals[0].type !== Enums_1.WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS &&
                        finalPickedWithdrawals[0].type !== Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS)) return [3, 3];
                    logger.info("picking withdrawal record case UTXO and withdraw from hot wallet");
                    return [4, gateway.constructRawTransaction(fromAddress.address, vouts)];
                case 2:
                    unsignedTx = _a.sent();
                    return [3, 6];
                case 3:
                    logger.info("picking withdrawal record case UTXO collect");
                    return [4, manager.getRepository(entities_1.Deposit).find({
                            where: {
                                collectWithdrawalId: typeorm_1.In(finalPickedWithdrawals.map(function (w) { return w.id; })),
                            },
                        })];
                case 4:
                    deposits = _a.sent();
                    return [4, __1._constructUtxoBasedCollectTx(deposits, finalPickedWithdrawals[0].toAddress)];
                case 5:
                    unsignedTx = _a.sent();
                    _a.label = 6;
                case 6: return [3, 12];
                case 7:
                    toAddress = vouts[0].toAddress;
                    tag = void 0;
                    try {
                        tag = finalPickedWithdrawals[0].memo || '';
                    }
                    catch (e) {
                    }
                    if (!((finalPickedWithdrawals[0] &&
                        finalPickedWithdrawals[0].type === Enums_1.WithdrawOutType.EXPLICIT_FROM_DEPOSIT_ADDRESS) ||
                        finalPickedWithdrawals[0].type === Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS)) return [3, 9];
                    logger.info("picking withdrawal record case Account Base collect");
                    return [4, gateway.constructRawTransaction(fromAddress.address, toAddress, amount, {
                            destinationTag: tag,
                            isConsolidate: currency.isNative,
                        })];
                case 8:
                    unsignedTx = _a.sent();
                    return [3, 12];
                case 9:
                    logger.info("picking withdrawal record case Account Base normal");
                    options = {
                        destinationTag: tag,
                    };
                    return [4, handleNetworkFee(manager, gateway, currency)];
                case 10:
                    explicitNetworkFee = _a.sent();
                    if (explicitNetworkFee) {
                        options.explicitGasPrice = explicitNetworkFee.gasPrice;
                        options.explicitGasLimit = explicitNetworkFee.gasLimit;
                    }
                    return [4, gateway.constructRawTransaction(fromAddress.address, toAddress, amount, options)];
                case 11:
                    unsignedTx = _a.sent();
                    _a.label = 12;
                case 12: return [2, unsignedTx];
                case 13:
                    err_1 = _a.sent();
                    logger.error("Could not create raw tx address=" + fromAddress.address + ", vouts=" + util_1.inspect(vouts) + ", error=" + util_1.inspect(err_1));
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Withdrawal, withdrawalIds)];
                case 14:
                    _a.sent();
                    return [2, null];
                case 15: return [2];
            }
        });
    });
}
function handleNetworkFee(manager, gateway, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var setting, feeThreshold, estimateFee, gasLimit, gasPrice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rawdb.findSettingByKey(manager, Enums_1.SettingKey.ETH_FEE_THRESHOLD.toUpperCase())];
                case 1:
                    setting = _a.sent();
                    if (!setting || setting.value === '0') {
                        logger.info("Network fee threshold is not set. Handle network fee as normal.");
                        return [2, null];
                    }
                    feeThreshold = new sota_common_1.BigNumber(setting.value);
                    return [4, gateway.estimateFee({
                            isConsolidate: currency.isNative,
                        })];
                case 2:
                    estimateFee = _a.sent();
                    if (estimateFee.lte(feeThreshold)) {
                        logger.info("Estimate fee = " + estimateFee + " is less than or equal fee_threshold setting = " + feeThreshold + " => Use estimate fee.");
                        return [2, null];
                    }
                    gasLimit = 150000;
                    gasPrice = feeThreshold.div(gasLimit).integerValue().toNumber();
                    logger.info("Estimate fee = " + estimateFee + " is greater than fee_threshold setting = " + feeThreshold + ". Gas limit = " + gasLimit + ", gas price = " + gasPrice);
                    return [2, {
                            gasLimit: gasLimit,
                            gasPrice: gasPrice,
                        }];
            }
        });
    });
}
function checkMaxFee(manager, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var maxFeeSetting, maxFeeByUsdSetting, maxFee;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rawdb.findSettingByKey(manager, Enums_1.SettingKey.MAX_FEE_BY_USD.toUpperCase())];
                case 1:
                    maxFeeSetting = _a.sent();
                    if (!maxFeeSetting) {
                        logger.info("Max fee by usd is not set. Handle network fee as normal.");
                        return [2, true];
                    }
                    maxFeeByUsdSetting = new sota_common_1.BigNumber(maxFeeSetting.value);
                    return [4, manager.getRepository(entities_1.MaxFee).findOne({
                            order: {
                                updatedAt: 'DESC',
                            },
                            where: {
                                currency: currency.isNative ? currency.platform : currency.tokenType,
                            },
                        })];
                case 2:
                    maxFee = _a.sent();
                    if (!maxFee) {
                        throw new Error("EthPickerDoProcess: Database has no max fee records. Please check maxFeeDoProcess");
                    }
                    if (Date.now() - maxFee.updatedAt > 300000) {
                        throw new Error("EthPickerDoProcess: The lastest maxFee record is old. Please check maxFeeDoProcess");
                    }
                    if (new sota_common_1.BigNumber(maxFee.feeByUsd).gt(maxFeeByUsdSetting)) {
                        logger.warn("PickerDoProcess will suspend all withdrawals because max_fee_by_usd in setting = " + maxFeeByUsdSetting + " less than current max_fee = " + maxFee.feeByUsd);
                        return [2, false];
                    }
                    return [2, true];
            }
        });
    });
}
exports.default = pickerDoProcess;
//# sourceMappingURL=pickerDoProcess.js.map