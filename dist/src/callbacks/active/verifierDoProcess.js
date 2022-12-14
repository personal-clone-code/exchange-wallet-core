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
exports.verifierDoProcess = void 0;
var sota_common_1 = require("sota-common");
var rawdb = __importStar(require("../../rawdb"));
var typeorm_1 = require("typeorm");
var Enums_1 = require("../../Enums");
var entities_1 = require("../../entities");
var processOneDepositTransaction_1 = require("../../rawdb/processOneDepositTransaction");
var logger = sota_common_1.getLogger('verifierDoProcess');
function verifierDoProcess(verfifier) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _verifierDoProcess(manager, verfifier)];
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
exports.verifierDoProcess = verifierDoProcess;
function _verifierDoProcess(manager, verifier) {
    return __awaiter(this, void 0, void 0, function () {
        var platformCurrency, allCurrencies, allSymbols, sentRecord, currency, gateway, transactionStatus, resTx, fee, isTxSucceed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platformCurrency = verifier.getCurrency();
                    allCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
                    allSymbols = allCurrencies.map(function (c) { return c.symbol; });
                    return [4, rawdb.findOneLocalTx(manager, allSymbols, [Enums_1.LocalTxStatus.SENT])];
                case 1:
                    sentRecord = _a.sent();
                    if (!sentRecord) {
                        logger.info("There are not sent localTxs to be verified: platform=" + platformCurrency.platform);
                        return [2];
                    }
                    logger.info("Found localTx need verifying: txid=" + sentRecord.txid);
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(sentRecord.currency);
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, gateway.getTransactionStatus(sentRecord.txid)];
                case 2:
                    transactionStatus = _a.sent();
                    if (!(transactionStatus === sota_common_1.TransactionStatus.UNKNOWN || transactionStatus === sota_common_1.TransactionStatus.CONFIRMING)) return [3, 4];
                    logger.info("Wait until new tx state " + sentRecord.txid);
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.LocalTx, [sentRecord.id])];
                case 3:
                    _a.sent();
                    return [2];
                case 4:
                    logger.info("Transaction " + sentRecord.txid + " is " + transactionStatus);
                    return [4, gateway.getOneTransaction(sentRecord.txid)];
                case 5:
                    resTx = _a.sent();
                    fee = resTx.getNetworkFee();
                    isTxSucceed = transactionStatus === sota_common_1.TransactionStatus.COMPLETED;
                    if (!sentRecord.isWithdrawal()) return [3, 7];
                    return [4, verifierWithdrawalDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block)];
                case 6:
                    _a.sent();
                    return [3, 14];
                case 7:
                    if (!sentRecord.isWithdrawalCollect()) return [3, 9];
                    return [4, verifierWithdrawalDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block)];
                case 8:
                    _a.sent();
                    return [3, 14];
                case 9:
                    if (!sentRecord.isCollectTx()) return [3, 11];
                    return [4, verifyCollectDoProcess(manager, sentRecord, isTxSucceed, resTx)];
                case 10:
                    _a.sent();
                    return [3, 14];
                case 11:
                    if (!sentRecord.isSeedTx()) return [3, 13];
                    return [4, verifySeedDoProcess(manager, sentRecord, isTxSucceed, fee, resTx.block)];
                case 12:
                    _a.sent();
                    return [3, 14];
                case 13:
                    logger.error("verifierDoProcess not supported localTxType: " + sentRecord.type);
                    _a.label = 14;
                case 14:
                    processOneDepositTransaction_1.updateAddressBalance(manager, resTx);
                    return [2];
            }
        });
    });
}
function verifierWithdrawalDoProcess(manager, sentRecord, isTxSucceed, fee, blockHeader) {
    return __awaiter(this, void 0, void 0, function () {
        var event, withdrawStatus, localTxStatus;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event = isTxSucceed ? Enums_1.WithdrawalEvent.COMPLETED : Enums_1.WithdrawalEvent.FAILED;
                    withdrawStatus = isTxSucceed ? Enums_1.WithdrawalStatus.COMPLETED : Enums_1.WithdrawalStatus.FAILED;
                    localTxStatus = isTxSucceed ? Enums_1.LocalTxStatus.COMPLETED : Enums_1.LocalTxStatus.FAILED;
                    return [4, sota_common_1.Utils.PromiseAll([
                            rawdb.updateWithdrawalsStatus(manager, sentRecord.id, withdrawStatus, event),
                            rawdb.updateLocalTxStatus(manager, sentRecord.id, localTxStatus, null, fee, blockHeader),
                            rawdb.updateWithdrawalTxWallets(manager, sentRecord, event, fee),
                        ])];
                case 1:
                    _a.sent();
                    return [4, rawdb.lowerThresholdHandle(manager, sentRecord)];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function verifyCollectDoProcess(manager, localTx, isTxSucceed, tx) {
    return __awaiter(this, void 0, void 0, function () {
        var fee, blockHeader, event, collectStatus, localTxStatus, tasks, toAddress, amount_1, hotWallet, currencyInfo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fee = tx.getNetworkFee();
                    blockHeader = tx.block;
                    event = isTxSucceed ? Enums_1.DepositEvent.COLLECTED : Enums_1.DepositEvent.COLLECTED_FAILED;
                    collectStatus = isTxSucceed ? Enums_1.CollectStatus.COLLECTED : Enums_1.CollectStatus.UNCOLLECTED;
                    localTxStatus = isTxSucceed ? Enums_1.LocalTxStatus.COMPLETED : Enums_1.LocalTxStatus.FAILED;
                    tasks = [
                        rawdb.updateLocalTxStatus(manager, localTx.id, localTxStatus, null, fee, blockHeader),
                        rawdb.updateDepositCollectStatusByCollectTxId(manager, localTx, collectStatus, event),
                    ];
                    toAddress = localTx.toAddress;
                    if (!toAddress) {
                        throw new Error("localTx id=" + localTx.id + " does not have toAddress");
                    }
                    if (isTxSucceed) {
                        amount_1 = new sota_common_1.BigNumber(0);
                        if (localTx.currency.startsWith("erc20.")) {
                            tx.extractOutputEntries().forEach(function (e) {
                                if (e.address !== toAddress) {
                                    return;
                                }
                                amount_1 = amount_1.plus(e.amount);
                            });
                        }
                        else {
                            amount_1 = new sota_common_1.BigNumber(localTx.amount);
                        }
                        tasks.push(rawdb.updateWalletBalanceAfterCollecting(manager, localTx, amount_1));
                    }
                    return [4, sota_common_1.Utils.PromiseAll(tasks)];
                case 1:
                    _a.sent();
                    tasks.length = 0;
                    return [4, rawdb.findHotWalletByAddress(manager, toAddress)];
                case 2:
                    hotWallet = _a.sent();
                    if (!hotWallet) {
                        tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, new sota_common_1.BigNumber(localTx.amount).minus(fee), Enums_1.WalletEvent.COLLECT_AMOUNT));
                        tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, Enums_1.WalletEvent.COLLECT_FEE));
                    }
                    else {
                        currencyInfo = sota_common_1.CurrencyRegistry.getOneCurrency(localTx.currency);
                        if (currencyInfo.isNative) {
                            tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, Enums_1.WalletEvent.COLLECT_FEE));
                        }
                        else {
                            logger.info(currencyInfo.symbol + " is not native, do not minus fee");
                            tasks.push(rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, new sota_common_1.BigNumber(0), Enums_1.WalletEvent.COLLECT_FEE));
                        }
                    }
                    return [4, sota_common_1.Utils.PromiseAll(tasks)];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function verifySeedDoProcess(manager, localTx, isTxSucceed, fee, blockHeader) {
    return __awaiter(this, void 0, void 0, function () {
        var event, collectStatus, localTxStatus, tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event = isTxSucceed ? Enums_1.DepositEvent.SEEDED : Enums_1.DepositEvent.SEEDED_FAILED;
                    collectStatus = isTxSucceed ? Enums_1.CollectStatus.COLLECTED : Enums_1.CollectStatus.UNCOLLECTED;
                    localTxStatus = isTxSucceed ? Enums_1.LocalTxStatus.COMPLETED : Enums_1.LocalTxStatus.FAILED;
                    tasks = [
                        rawdb.updateLocalTxStatus(manager, localTx.id, localTxStatus, null, fee, blockHeader),
                        rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, new sota_common_1.BigNumber(localTx.amount), Enums_1.WalletEvent.SEED_AMOUNT),
                        rawdb.updateWalletBalanceOnlyFee(manager, localTx, collectStatus, fee, Enums_1.WalletEvent.SEED_FEE),
                        rawdb.updateDepositCollectStatusBySeedTxId(manager, localTx, Enums_1.CollectStatus.UNCOLLECTED, event),
                    ];
                    return [4, sota_common_1.Utils.PromiseAll(tasks)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=verifierDoProcess.js.map