"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWithdrawalTxWallets = void 0;
var _ = __importStar(require("lodash"));
var sota_common_1 = require("sota-common");
var Enums_1 = require("../Enums");
var entities_1 = require("../entities");
var rawdb = __importStar(require("./index"));
var sota_common_2 = require("sota-common");
var logger = sota_common_1.getLogger("updateWithdrawalTxWallets");
function updateWithdrawalTxWallets(manager, localTx, event, fee) {
    return __awaiter(this, void 0, void 0, function () {
        var withdrawals, walletEvent, currency, feeCurrency, minusFee, tasks, withdrawalFeeLog;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.find(entities_1.Withdrawal, {
                        withdrawalTxId: localTx.id,
                    })];
                case 1:
                    withdrawals = _a.sent();
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(localTx.currency);
                    feeCurrency = sota_common_1.CurrencyRegistry.getOneCurrency(localTx.currency).platform;
                    if (!withdrawals.length) {
                        return [2, null];
                    }
                    minusFee = false;
                    tasks = _.map(withdrawals, function (record) { return __awaiter(_this, void 0, void 0, function () {
                        var toAddress, fromAddress, toAddressRecord, fromAddressRecord, balanceChange, walletBalance, balanceAfter, balanceAfter, walletLog;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    toAddress = record.toAddress;
                                    fromAddress = record.fromAddress;
                                    return [4, manager
                                            .getRepository(entities_1.HotWallet)
                                            .findOne({ address: toAddress, walletId: record.walletId })];
                                case 1:
                                    toAddressRecord = _a.sent();
                                    return [4, manager
                                            .getRepository(entities_1.HotWallet)
                                            .findOne({ address: fromAddress, walletId: record.walletId })];
                                case 2:
                                    fromAddressRecord = _a.sent();
                                    minusFee = fromAddressRecord ? true : false;
                                    return [4, manager.findOne(entities_1.WalletBalance, {
                                            walletId: record.walletId,
                                        })];
                                case 3:
                                    walletBalance = _a.sent();
                                    if (!walletBalance) {
                                        throw new Error('walletBalance is not existed');
                                    }
                                    if (event === Enums_1.WithdrawalEvent.FAILED) {
                                        walletEvent = Enums_1.WalletEvent.WITHDRAW_FAILED;
                                        balanceChange = '0';
                                    }
                                    if (event === Enums_1.WithdrawalEvent.COMPLETED) {
                                        walletEvent = Enums_1.WalletEvent.WITHDRAW_COMPLETED;
                                        if (fromAddressRecord && !toAddressRecord) {
                                            logger.debug("case hot wallet to normal address");
                                            if (currency.isNative) {
                                                balanceAfter = new sota_common_1.BigNumber(record.amount).minus(fee);
                                                balanceChange = "-" + (balanceAfter.lte(0) ? record.amount : balanceAfter.toString());
                                            }
                                            else {
                                                balanceChange = '-' + record.amount;
                                            }
                                        }
                                        else if (!fromAddressRecord && toAddressRecord) {
                                            logger.debug("case normal address to hot wallet");
                                            if (currency.isNative) {
                                                balanceAfter = new sota_common_1.BigNumber(record.amount).minus(fee);
                                                balanceChange = "+" + (balanceAfter.lte(0) ? record.amount : balanceAfter.toString());
                                            }
                                            else {
                                                balanceChange = '+' + record.amount;
                                            }
                                        }
                                        else {
                                            logger.debug("case normal address to normal address");
                                            balanceChange = '0';
                                        }
                                    }
                                    walletLog = new entities_1.WalletLog();
                                    walletLog.walletId = walletBalance.walletId;
                                    walletLog.currency = localTx.currency;
                                    walletLog.refCurrency = localTx.currency;
                                    walletLog.balanceChange = balanceChange;
                                    walletLog.event = walletEvent;
                                    walletLog.refId = record.id;
                                    return [4, sota_common_2.Utils.PromiseAll([
                                            manager
                                                .createQueryBuilder()
                                                .update(entities_1.WalletBalance)
                                                .set({
                                                balance: function () {
                                                    if (event === Enums_1.WithdrawalEvent.COMPLETED) {
                                                        return "balance + " + balanceChange;
                                                    }
                                                    return "balance";
                                                },
                                                updatedAt: sota_common_2.Utils.nowInMillis(),
                                            })
                                                .where({
                                                walletId: record.walletId,
                                                currency: record.currency,
                                            })
                                                .execute(),
                                            rawdb.insertWalletLog(manager, walletLog),
                                        ])];
                                case 4:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); });
                    if (event === Enums_1.WithdrawalEvent.COMPLETED && minusFee) {
                        withdrawalFeeLog = new entities_1.WalletLog();
                        withdrawalFeeLog.walletId = withdrawals[0].walletId;
                        withdrawalFeeLog.currency = feeCurrency;
                        withdrawalFeeLog.refCurrency = localTx.currency;
                        withdrawalFeeLog.balanceChange = "-" + fee;
                        withdrawalFeeLog.event = Enums_1.WalletEvent.WITHDRAW_FEE;
                        withdrawalFeeLog.refId = localTx.id;
                        tasks.push(manager
                            .createQueryBuilder()
                            .update(entities_1.WalletBalance)
                            .set({
                            balance: function () { return "balance - " + fee.toFixed(sota_common_1.CurrencyRegistry.getOneCurrency(feeCurrency).nativeScale); },
                            updatedAt: sota_common_2.Utils.nowInMillis(),
                        })
                            .where({
                            walletId: withdrawals[0].walletId,
                            currency: feeCurrency,
                        })
                            .execute());
                        tasks.push(rawdb.insertWalletLog(manager, withdrawalFeeLog));
                    }
                    return [4, Promise.all(tasks)];
                case 2:
                    _a.sent();
                    return [2, null];
            }
        });
    });
}
exports.updateWithdrawalTxWallets = updateWithdrawalTxWallets;
//# sourceMappingURL=updateWithdrawalTxWallets.js.map