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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDepositsInCollectingTx = exports.findOneGroupOfDeposits = exports.findOneGroupOfDepositsNeedSeedingFee = exports.findOneGroupOfCollectableDeposits = void 0;
var typeorm_1 = require("typeorm");
var lodash_1 = __importDefault(require("lodash"));
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var sota_common_1 = require("sota-common");
var rawdb = __importStar(require("./"));
var logger = sota_common_1.getLogger('rawdb::findDeposits');
function findOneGroupOfCollectableDeposits(manager, currencies) {
    return __awaiter(this, void 0, void 0, function () {
        var uncollectStatuses, _a, walletId, currency, records, finalRecords, chosenAddress_1, totalAmount, currencyInfo, depositIds;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    uncollectStatuses = [Enums_1.CollectStatus.UNCOLLECTED];
                    return [4, findOneGroupOfDeposits(manager, currencies, uncollectStatuses)];
                case 1:
                    _a = _b.sent(), walletId = _a.walletId, currency = _a.currency, records = _a.records;
                    if (!currency || !records.length) {
                        return [2, {
                                walletId: 0,
                                currency: null,
                                records: [],
                                amount: new sota_common_1.BigNumber(0),
                            }];
                    }
                    finalRecords = [];
                    if (currency.isUTXOBased) {
                        finalRecords.push.apply(finalRecords, records);
                    }
                    else {
                        chosenAddress_1 = records[0].toAddress;
                        finalRecords.push.apply(finalRecords, records.filter(function (deposit) { return deposit.toAddress === chosenAddress_1; }));
                    }
                    totalAmount = new sota_common_1.BigNumber(0);
                    finalRecords.map(function (record) {
                        totalAmount = totalAmount.plus(new sota_common_1.BigNumber(record.amount));
                    });
                    return [4, rawdb.findOneCurrency(manager, currency.symbol, walletId)];
                case 2:
                    currencyInfo = _b.sent();
                    if (!currencyInfo) {
                        logger.info(currency.symbol + " does not have a minimum collect amount, so collect");
                        return [2, { walletId: walletId, currency: currency, records: finalRecords, amount: totalAmount }];
                    }
                    if (!totalAmount.lt(new sota_common_1.BigNumber(currencyInfo.minimumCollectAmount))) return [3, 5];
                    depositIds = finalRecords.map(function (deposit) { return deposit.id; });
                    logger.info(currency.symbol + " does not have a enough collect amount, next time      depositIds=[" + depositIds + "],       totalAmount=" + totalAmount.toString() + "      minCollectAmountConfig=" + currencyInfo.minimumCollectAmount);
                    if (!(finalRecords.length > 0)) return [3, 4];
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, finalRecords.map(function (r) { return r.id; }))];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4: return [2, {
                        walletId: 0,
                        currency: null,
                        records: [],
                        amount: new sota_common_1.BigNumber(0),
                    }];
                case 5: return [2, { walletId: walletId, currency: currency, records: finalRecords, amount: totalAmount }];
            }
        });
    });
}
exports.findOneGroupOfCollectableDeposits = findOneGroupOfCollectableDeposits;
function findOneGroupOfDepositsNeedSeedingFee(manager, currencies) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, walletId, currency, records, chosenAddress, nativeGateway, nativeBalance, requiredBalance;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    currencies = currencies.filter(function (c) { return !sota_common_1.CurrencyRegistry.hasOneNativeCurrency(c); });
                    if (!currencies.length) {
                        return [2, { walletId: 0, currency: null, records: [] }];
                    }
                    return [4, findOneGroupOfCollectableDeposits(manager, currencies)];
                case 1:
                    _a = _b.sent(), walletId = _a.walletId, currency = _a.currency, records = _a.records;
                    if (!walletId || !currency || !records.length) {
                        return [2, { walletId: 0, currency: null, records: [] }];
                    }
                    if (currency.isUTXOBased) {
                        logger.info("Will not seed fee for utxo-based currency=" + currency.symbol + " depositIds=[" + records.map(function (r) { return r.id; }) + "]");
                        rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, records.map(function (r) { return r.id; }));
                        return [2, { walletId: 0, currency: null, records: [] }];
                    }
                    chosenAddress = records[0].toAddress;
                    nativeGateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency.platform);
                    return [4, nativeGateway.getAddressBalance(chosenAddress)];
                case 2:
                    nativeBalance = _b.sent();
                    requiredBalance = new sota_common_1.BigNumber(0);
                    switch (currency.platform) {
                        case sota_common_1.BlockchainPlatform.Ethereum:
                            requiredBalance = new sota_common_1.BigNumber(0.001 * 1e18);
                            break;
                        case sota_common_1.BlockchainPlatform.Bitcoin:
                            requiredBalance = new sota_common_1.BigNumber(0.0001 * 1e18);
                            break;
                        default:
                            throw new Error("Unsupported platform: " + currency.platform + ", TODO: Implement me...");
                    }
                    if (nativeBalance.gte(requiredBalance)) {
                        rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, records.map(function (r) { return r.id; }));
                        return [2, { walletId: 0, currency: null, records: [] }];
                    }
                    return [2, { walletId: walletId, currency: currency, records: records }];
            }
        });
    });
}
exports.findOneGroupOfDepositsNeedSeedingFee = findOneGroupOfDepositsNeedSeedingFee;
function findOneGroupOfDeposits(manager, currencies, collectStatuses) {
    return __awaiter(this, void 0, void 0, function () {
        var now, uncollectedDeposits, selected, currencyInfo, platformSelected, selectedWalletId, selectedCurrency, currency, records;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = sota_common_1.Utils.nowInMillis();
                    return [4, manager.getRepository(entities_1.Deposit).find({
                            order: {
                                updatedAt: 'ASC',
                            },
                            where: {
                                currency: typeorm_1.In(currencies),
                                collectStatus: typeorm_1.In(collectStatuses),
                            },
                        })];
                case 1:
                    uncollectedDeposits = _a.sent();
                    if (!uncollectedDeposits.length) {
                        return [2, { walletId: 0, currency: null, records: [] }];
                    }
                    selected = uncollectedDeposits[0];
                    currencyInfo = sota_common_1.CurrencyRegistry.getOneCurrency(selected.currency);
                    if (!currencyInfo.isNative) {
                        platformSelected = lodash_1.default.find(uncollectedDeposits, {
                            toAddress: selected.toAddress,
                            currency: currencyInfo.platform,
                        });
                        if (platformSelected) {
                            selected = platformSelected;
                        }
                    }
                    selectedWalletId = uncollectedDeposits[0].walletId;
                    selectedCurrency = uncollectedDeposits[0].currency;
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(selectedCurrency);
                    records = uncollectedDeposits.filter(function (deposit) {
                        return deposit.walletId === selectedWalletId && deposit.currency === selectedCurrency;
                    });
                    return [2, { walletId: selectedWalletId, currency: currency, records: records }];
            }
        });
    });
}
exports.findOneGroupOfDeposits = findOneGroupOfDeposits;
function findDepositsInCollectingTx(manager, localTxId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.Deposit).find({
                        where: {
                            collectLocalTxId: localTxId,
                        },
                    })];
                case 1: return [2, _a.sent()];
            }
        });
    });
}
exports.findDepositsInCollectingTx = findDepositsInCollectingTx;
//# sourceMappingURL=findDeposits.js.map