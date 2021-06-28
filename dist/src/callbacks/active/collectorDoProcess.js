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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports._constructUtxoBasedCollectTx = exports.collectorDoProcess = void 0;
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var rawdb = __importStar(require("../../rawdb"));
var Enums_1 = require("../../Enums");
var entities_1 = require("../../entities");
var logger = sota_common_1.getLogger('collectorDoProcess');
function collectorDoProcess(collector) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _collectorDoProcess(manager, collector)];
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
exports.collectorDoProcess = collectorDoProcess;
function _collectorDoProcess(manager, collector) {
    return __awaiter(this, void 0, void 0, function () {
        var platformCurrency, platformCurrencies, allSymbols, _a, walletId, currency, records, amount, gateway, balance, minimumBalance, rallyWallet, rawTx, gateway, minAmount, currencyConfig, _b, withdrawalStatuses, tokenGateway, _c, _d, _e, _f, _g, _h, record, balance, _j, _k, err_1, record, seedRequested, pairs_1, _l, localTx;
        var _this = this;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    platformCurrency = collector.getCurrency();
                    platformCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
                    allSymbols = platformCurrencies.map(function (c) { return c.symbol; });
                    return [4, rawdb.findOneGroupOfCollectableDeposits(manager, allSymbols)];
                case 1:
                    _a = _m.sent(), walletId = _a.walletId, currency = _a.currency, records = _a.records, amount = _a.amount;
                    if (!walletId || !currency || !records.length || amount.isZero()) {
                        logger.info("There're no uncollected deposit right now. Will try to process later...");
                        return [2];
                    }
                    if (!(currency.symbol === sota_common_1.CurrencyRegistry.Solana.symbol)) return [3, 4];
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, gateway.getAddressBalance(records[0].toAddress)];
                case 2:
                    balance = _m.sent();
                    return [4, gateway.getMinimumBalanceForRentExemption()];
                case 3:
                    minimumBalance = _m.sent();
                    if (balance.minus(minimumBalance).lte(0)) {
                        logger.info(currency.symbol + " does not have a enough collect amount, minimumBalance=" + minimumBalance + ", totalAmount=" + amount + ". Will try to process later...");
                        return [2];
                    }
                    _m.label = 4;
                case 4:
                    rallyWallet = null;
                    if (!currency.symbol) return [3, 6];
                    return [4, rawdb.findAnyRallyWallet(manager, walletId, currency.symbol)];
                case 5:
                    rallyWallet = _m.sent();
                    _m.label = 6;
                case 6:
                    if (!!rallyWallet) return [3, 8];
                    return [4, rawdb.findAnyRallyWallet(manager, walletId, currency.platform)];
                case 7:
                    rallyWallet = _m.sent();
                    _m.label = 8;
                case 8:
                    if (!(!rallyWallet && currency.family)) return [3, 10];
                    return [4, rawdb.findAnyRallyWallet(manager, walletId, currency.family)];
                case 9:
                    rallyWallet = _m.sent();
                    _m.label = 10;
                case 10:
                    if (!rallyWallet) {
                        throw new Error("Rally wallet for symbol=" + currency.symbol + " and platform=" + currency.platform + " not found");
                    }
                    _m.label = 11;
                case 11:
                    _m.trys.push([11, 32, , 37]);
                    if (!!currency.isNative) return [3, 24];
                    return [4, sota_common_1.GatewayRegistry.getGatewayInstance(currency.platform)];
                case 12:
                    gateway = _m.sent();
                    minAmount = new sota_common_1.BigNumber(0);
                    return [4, rawdb.findOneCurrency(manager, currency.platform, walletId)];
                case 13:
                    currencyConfig = _m.sent();
                    if (!(currencyConfig && currencyConfig.minimumCollectAmount)) return [3, 14];
                    minAmount = new sota_common_1.BigNumber(currencyConfig.minimumCollectAmount);
                    return [3, 22];
                case 14:
                    if (!(currency.platform === sota_common_1.BlockchainPlatform.Solana)) return [3, 20];
                    _b = sota_common_1.BigNumber.bind;
                    return [4, gateway.getMinimumBalanceForRentExemption()];
                case 15:
                    minAmount = new (_b.apply(sota_common_1.BigNumber, [void 0, _m.sent()]))();
                    withdrawalStatuses = [Enums_1.WithdrawalStatus.UNSIGNED, Enums_1.WithdrawalStatus.SIGNED, Enums_1.WithdrawalStatus.SIGNING, Enums_1.WithdrawalStatus.SENT, Enums_1.WithdrawalStatus.COMPLETED];
                    return [4, rawdb.hasAnyCollectFromAddressToAddress(manager, currency.symbol, withdrawalStatuses, rallyWallet.addresss, records[0].toAddress)];
                case 16:
                    if (!!(_m.sent())) return [3, 19];
                    tokenGateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency.symbol);
                    _d = (_c = minAmount).plus;
                    return [4, tokenGateway.getMinimumBalanceForRentExemption()];
                case 17:
                    _f = (_e = (_m.sent())).plus;
                    return [4, gateway.getAverageSeedingFee()];
                case 18:
                    minAmount = _d.apply(_c, [_f.apply(_e, [(_m.sent()).multipliedBy(new sota_common_1.BigNumber(3))])]);
                    _m.label = 19;
                case 19: return [3, 22];
                case 20:
                    _h = (_g = minAmount).plus;
                    return [4, gateway.getAverageSeedingFee()];
                case 21:
                    minAmount = _h.apply(_g, [(_m.sent()).multipliedBy(new sota_common_1.BigNumber(3))]);
                    _m.label = 22;
                case 22:
                    record = records[0];
                    return [4, gateway.getAddressBalance(record.toAddress)];
                case 23:
                    balance = _m.sent();
                    if (balance.gte(minAmount)) {
                        logger.error("deposit id=" + record.id + " is pending, if it last for long, collect manually");
                        manager.update(entities_1.Deposit, record.id, {
                            updatedAt: sota_common_1.Utils.nowInMillis() + 3 * 60 * 1000,
                        });
                        return [2];
                    }
                    _m.label = 24;
                case 24:
                    if (!(currency.platform === sota_common_1.BlockchainPlatform.Solana)) return [3, 26];
                    return [4, _constructSolanaBasedCollectTx(records, rallyWallet.address, amount)];
                case 25:
                    _j = _m.sent();
                    return [3, 31];
                case 26:
                    if (!currency.isUTXOBased) return [3, 28];
                    return [4, _constructUtxoBasedCollectTx(records, rallyWallet.address)];
                case 27:
                    _k = _m.sent();
                    return [3, 30];
                case 28: return [4, _constructAccountBasedCollectTx(records, rallyWallet.address)];
                case 29:
                    _k = _m.sent();
                    _m.label = 30;
                case 30:
                    _j = (_k);
                    _m.label = 31;
                case 31:
                    rawTx = _j;
                    return [3, 37];
                case 32:
                    err_1 = _m.sent();
                    if (currency.platform === sota_common_1.BlockchainPlatform.Solana && !err_1.toString().includes('has insufficient funds for fee')) {
                        throw err_1;
                    }
                    logger.error("Cannot create raw transaction, may need fee seeder err=" + err_1);
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, records.map(function (r) { return r.id; }))];
                case 33:
                    _m.sent();
                    if (!!currency.isNative) return [3, 36];
                    record = records[0];
                    return [4, rawdb.hasAnySeedRequestedToAddress(manager, record.toAddress)];
                case 34:
                    seedRequested = _m.sent();
                    if (!!seedRequested) {
                        logger.warn("Address " + record.toAddress + " has seed requested or seeding. So, don't need more seed requests at this time.");
                        return [2];
                    }
                    record.collectStatus = Enums_1.CollectStatus.SEED_REQUESTED;
                    return [4, manager.save(record)];
                case 35:
                    _m.sent();
                    _m.label = 36;
                case 36: return [2];
                case 37:
                    if (!rawTx) {
                        throw new Error('rawTx is undefined because of unknown problem');
                    }
                    return [4, rawdb.isExternalAddress(manager, rallyWallet.address)];
                case 38:
                    if (!_m.sent()) return [3, 44];
                    logger.info(rallyWallet.address + " is external, create withdrawal record to withdraw out");
                    if (!(currency.isUTXOBased && currency.platform !== sota_common_1.BlockchainPlatform.NEO)) return [3, 40];
                    return [4, rawdb.insertWithdrawals(manager, records, rallyWallet.address, rallyWallet.userId)];
                case 39:
                    _l = _m.sent();
                    return [3, 42];
                case 40: return [4, rawdb.insertWithdrawal(manager, records, rallyWallet.address, rallyWallet.userId, amount)];
                case 41:
                    _l = _m.sent();
                    _m.label = 42;
                case 42:
                    pairs_1 = _l;
                    return [4, Promise.all(records.map(function (r) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2, Promise.all([
                                        manager.update(entities_1.Deposit, r.id, {
                                            updatedAt: sota_common_1.Utils.nowInMillis(),
                                            collectStatus: Enums_1.CollectStatus.COLLECTING,
                                            collectWithdrawalId: pairs_1.get(r.id),
                                            collectType: Enums_1.CollectType.WITHDRAWAL,
                                        }),
                                    ])];
                            });
                        }); }))];
                case 43:
                    _m.sent();
                    logger.info("Collect tx queued: address=" + rallyWallet.address + ", withdrawals=" + records.map(function (r) { return r.id; }));
                    return [2];
                case 44: return [4, rawdb.insertLocalTx(manager, {
                        fromAddress: 'FIND_IN_DEPOSIT',
                        toAddress: rallyWallet.address,
                        userId: rallyWallet.userId,
                        walletId: rallyWallet.walletId,
                        currency: currency.symbol,
                        refCurrency: records[0].currency,
                        refId: 0,
                        refTable: Enums_1.RefTable.DEPOSIT,
                        type: Enums_1.LocalTxType.COLLECT,
                        status: Enums_1.LocalTxStatus.SIGNING,
                        unsignedRaw: rawTx.unsignedRaw,
                        unsignedTxid: rawTx.txid,
                        amount: amount.toString(),
                    })];
                case 45:
                    localTx = _m.sent();
                    return [4, manager.update(entities_1.Deposit, records.map(function (r) { return r.id; }), {
                            updatedAt: sota_common_1.Utils.nowInMillis(),
                            collectLocalTxId: localTx.id,
                            collectStatus: Enums_1.CollectStatus.COLLECTING,
                        })];
                case 46:
                    _m.sent();
                    logger.info("Collect tx queued: address=" + rallyWallet.address + ", txid=" + rawTx.txid + ", localTxId=" + localTx.id);
                    return [2];
            }
        });
    });
}
function _constructUtxoBasedCollectTx(deposits, toAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var currency, gateway, utxos, weirdVouts, depositAddresses, depositAmount, utxoAmount;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(deposits[0].currency);
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    utxos = [];
                    weirdVouts = [];
                    depositAddresses = [];
                    return [4, sota_common_1.Utils.PromiseAll(deposits.map(function (deposit) { return __awaiter(_this, void 0, void 0, function () {
                            var depositAddress, txid, depositVouts, allAddressUtxos;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        depositAddress = deposit.toAddress;
                                        txid = deposit.txid;
                                        if (depositAddresses.indexOf(depositAddress) === -1) {
                                            depositAddresses.push(depositAddress);
                                        }
                                        return [4, gateway.getOneTxVouts(deposit.txid, depositAddress)];
                                    case 1:
                                        depositVouts = _a.sent();
                                        return [4, gateway.getOneAddressUtxos(depositAddress)];
                                    case 2:
                                        allAddressUtxos = _a.sent();
                                        depositVouts.forEach(function (vout) {
                                            if (vout.spentTxId) {
                                                weirdVouts.push(vout);
                                                return;
                                            }
                                            var utxo = allAddressUtxos.find(function (u) {
                                                return u.txid === txid && u.address === depositAddress && u.vout === vout.n;
                                            });
                                            if (!utxo) {
                                                logger.error("Output has been spent already: address=" + depositAddress + ", txid=" + txid + ", n=" + vout.n);
                                                return;
                                            }
                                            utxos.push(utxo);
                                        });
                                        return [2];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    if (weirdVouts.length > 0) {
                        throw new Error("Weird outputs were spent without collecting: " + JSON.stringify(weirdVouts));
                    }
                    depositAmount = deposits.reduce(function (memo, d) { return memo.plus(new sota_common_1.BigNumber(d.amount)); }, new sota_common_1.BigNumber(0));
                    utxoAmount = utxos.reduce(function (memo, u) { return memo.plus(new sota_common_1.BigNumber(u.satoshis || 0)); }, new sota_common_1.BigNumber(0));
                    if (!depositAmount.eq(utxoAmount)) {
                        throw new Error("Mismatch collecting values: depositAmount=" + depositAmount + ", utxoAmount=" + utxoAmount);
                    }
                    return [2, gateway.constructRawConsolidateTransaction(utxos, toAddress)];
            }
        });
    });
}
exports._constructUtxoBasedCollectTx = _constructUtxoBasedCollectTx;
function _constructAccountBasedCollectTx(deposits, toAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var currency, gateway, amount;
        return __generator(this, function (_a) {
            currency = sota_common_1.CurrencyRegistry.getOneCurrency(deposits[0].currency);
            gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
            amount = deposits.reduce(function (memo, deposit) {
                return memo.plus(new sota_common_1.BigNumber(deposit.amount));
            }, new sota_common_1.BigNumber(0));
            return [2, gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount, {
                    isConsolidate: currency.isNative,
                    useLowerNetworkFee: true,
                })];
        });
    });
}
function _constructSolanaBasedCollectTx(deposits, toAddress, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var currency, gateway;
        return __generator(this, function (_a) {
            currency = sota_common_1.CurrencyRegistry.getOneCurrency(deposits[0].currency);
            gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
            return [2, gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount, {
                    isConsolidate: currency.isNative,
                    needFunding: !currency.isNative,
                    maintainRent: true,
                })];
        });
    });
}
//# sourceMappingURL=collectorDoProcess.js.map