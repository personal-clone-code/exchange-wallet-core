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
        var platformCurrency, platformCurrencies, allSymbols, _a, walletId, currency, records, amount, rallyWallet, rawTx, gateway, minAmount, currencyConfig, record, balance, _b, err_1, record, seedRequested, pairs_1, localTx;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    platformCurrency = collector.getCurrency();
                    platformCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
                    allSymbols = platformCurrencies.map(function (c) { return c.symbol; });
                    return [4, rawdb.findOneGroupOfCollectableDeposits(manager, allSymbols)];
                case 1:
                    _a = _c.sent(), walletId = _a.walletId, currency = _a.currency, records = _a.records, amount = _a.amount;
                    if (!walletId || !currency || !records.length || amount.isZero()) {
                        logger.info("There're no uncollected deposit right now. Will try to process later...");
                        return [2];
                    }
                    return [4, rawdb.findAnyRallyWallet(manager, walletId, currency.platform)];
                case 2:
                    rallyWallet = _c.sent();
                    if (!rallyWallet) {
                        throw new Error("Rally wallet for symbol=" + currency.platform + " not found");
                    }
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 15, , 20]);
                    if (!!currency.isNative) return [3, 10];
                    return [4, sota_common_1.GatewayRegistry.getGatewayInstance(currency.platform)];
                case 4:
                    gateway = _c.sent();
                    minAmount = void 0;
                    return [4, rawdb.findOneCurrency(manager, currency.platform, walletId)];
                case 5:
                    currencyConfig = _c.sent();
                    if (!(currencyConfig && currencyConfig.minimumCollectAmount)) return [3, 6];
                    minAmount = new sota_common_1.BigNumber(currencyConfig.minimumCollectAmount);
                    return [3, 8];
                case 6: return [4, gateway.getAverageSeedingFee()];
                case 7:
                    minAmount = (_c.sent()).multipliedBy(new sota_common_1.BigNumber(3));
                    _c.label = 8;
                case 8:
                    record = records[0];
                    return [4, gateway.getAddressBalance(record.toAddress)];
                case 9:
                    balance = _c.sent();
                    if (balance.gte(minAmount)) {
                        logger.error("deposit id=" + record.id + " is pending, if it last for long, collect manually");
                        manager.update(entities_1.Deposit, record.id, {
                            updatedAt: sota_common_1.Utils.nowInMillis() + 3 * 60 * 1000,
                        });
                        return [2];
                    }
                    _c.label = 10;
                case 10:
                    if (!currency.isUTXOBased) return [3, 12];
                    return [4, _constructUtxoBasedCollectTx(records, rallyWallet.address)];
                case 11:
                    _b = _c.sent();
                    return [3, 14];
                case 12: return [4, _constructAccountBasedCollectTx(records, rallyWallet.address)];
                case 13:
                    _b = _c.sent();
                    _c.label = 14;
                case 14:
                    rawTx = _b;
                    return [3, 20];
                case 15:
                    err_1 = _c.sent();
                    logger.error("Cannot create raw transaction, may need fee seeder err=" + err_1);
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, records.map(function (r) { return r.id; }))];
                case 16:
                    _c.sent();
                    if (!!currency.isNative) return [3, 19];
                    record = records[0];
                    return [4, rawdb.hasAnySeedRequestedToAddress(manager, record.toAddress)];
                case 17:
                    seedRequested = _c.sent();
                    if (!!seedRequested) {
                        logger.warn("Address " + record.toAddress + " has seed requested or seeding. So, don't need more seed requests at this time.");
                        return [2];
                    }
                    record.collectStatus = Enums_1.CollectStatus.SEED_REQUESTED;
                    return [4, manager.save(record)];
                case 18:
                    _c.sent();
                    _c.label = 19;
                case 19: return [2];
                case 20:
                    if (!rawTx) {
                        throw new Error('rawTx is undefined because of unknown problem');
                    }
                    return [4, rawdb.isExternalAddress(manager, rallyWallet.address)];
                case 21:
                    if (!_c.sent()) return [3, 24];
                    logger.info(rallyWallet.address + " is external, create withdrawal record to withdraw out");
                    return [4, rawdb.insertWithdrawals(manager, records, rallyWallet.address, rallyWallet.userId)];
                case 22:
                    pairs_1 = _c.sent();
                    return [4, Promise.all(records.map(function (r) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, manager.update(entities_1.Deposit, r.id, {
                                            updatedAt: sota_common_1.Utils.nowInMillis(),
                                            collectStatus: Enums_1.CollectStatus.COLLECTING,
                                            collectWithdrawalId: pairs_1.get(r.id),
                                            collectType: Enums_1.CollectType.WITHDRAWAL,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        }); }))];
                case 23:
                    _c.sent();
                    logger.info("Collect tx queued: address=" + rallyWallet.address + ", withdrawals=" + records.map(function (r) { return r.id; }));
                    return [2];
                case 24: return [4, rawdb.insertLocalTx(manager, {
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
                case 25:
                    localTx = _c.sent();
                    return [4, manager.update(entities_1.Deposit, records.map(function (r) { return r.id; }), {
                            updatedAt: sota_common_1.Utils.nowInMillis(),
                            collectLocalTxId: localTx.id,
                            collectStatus: Enums_1.CollectStatus.COLLECTING,
                        })];
                case 26:
                    _c.sent();
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
                    utxoAmount = utxos.reduce(function (memo, u) { return memo.plus(new sota_common_1.BigNumber(u.satoshis)); }, new sota_common_1.BigNumber(0));
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
//# sourceMappingURL=collectorDoProcess.js.map