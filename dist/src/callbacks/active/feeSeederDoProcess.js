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
var logger = sota_common_1.getLogger('feeSeederDoProcess');
function feeSeederDoProcess(seeder) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _feeSeederDoProcess(manager, seeder)];
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
exports.feeSeederDoProcess = feeSeederDoProcess;
function _feeSeederDoProcess(manager, seeder) {
    return __awaiter(this, void 0, void 0, function () {
        var platformCurrency, platformCurrencies, allSymbols, seedDeposit, currency, gateway, seedAmount, hotWallet, rawTx, _a, err_1, localTx;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    platformCurrency = seeder.getCurrency();
                    platformCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
                    allSymbols = platformCurrencies.map(function (c) { return c.symbol; });
                    return [4, manager.findOne(entities_1.Deposit, {
                            currency: typeorm_1.In(allSymbols),
                            collectStatus: Enums_1.CollectStatus.SEED_REQUESTED,
                        })];
                case 1:
                    seedDeposit = _b.sent();
                    if (!seedDeposit) {
                        logger.info('No deposit need seeding');
                        return [2];
                    }
                    logger.info("Found deposit need seeding id=" + seedDeposit.id);
                    currency = platformCurrency;
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, gateway.getAverageSeedingFee()];
                case 2:
                    seedAmount = _b.sent();
                    return [4, rawdb.findSufficientHotWallet(manager, seedDeposit.walletId, currency, seedAmount, sota_common_1.HotWalletType.Seed)];
                case 3:
                    hotWallet = _b.sent();
                    if (!hotWallet) {
                        logger.info("Hot wallet for seeding depositId=" + seedDeposit.id + " symbol=" + currency.platform + " not found");
                        return [2];
                    }
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 9, , 11]);
                    if (!currency.isUTXOBased) return [3, 6];
                    return [4, gateway.constructRawTransaction(hotWallet.address, [
                            { toAddress: seedDeposit.toAddress, amount: seedAmount },
                        ])];
                case 5:
                    _a = _b.sent();
                    return [3, 8];
                case 6: return [4, gateway.constructRawTransaction(hotWallet.address, seedDeposit.toAddress, seedAmount, {})];
                case 7:
                    _a = _b.sent();
                    _b.label = 8;
                case 8:
                    rawTx = _a;
                    return [3, 11];
                case 9:
                    err_1 = _b.sent();
                    logger.error("Cannot create raw transaction, hot wallet balance may be not enough");
                    return [4, rawdb.updateRecordsTimestamp(manager, entities_1.Deposit, [seedDeposit.id])];
                case 10:
                    _b.sent();
                    throw err_1;
                case 11:
                    if (!rawTx) {
                        throw new Error('rawTx is undefined because of unknown problem');
                    }
                    return [4, rawdb.insertLocalTx(manager, {
                            fromAddress: hotWallet.address,
                            toAddress: seedDeposit.toAddress,
                            userId: hotWallet.userId,
                            walletId: hotWallet.walletId,
                            currency: currency.symbol,
                            refCurrency: seedDeposit.currency,
                            refId: 0,
                            refTable: Enums_1.RefTable.DEPOSIT,
                            type: Enums_1.LocalTxType.SEED,
                            status: Enums_1.LocalTxStatus.SIGNING,
                            unsignedRaw: rawTx.unsignedRaw,
                            unsignedTxid: rawTx.txid,
                            amount: seedAmount.toString(),
                        })];
                case 12:
                    localTx = _b.sent();
                    return [4, manager.update(entities_1.Deposit, seedDeposit.id, {
                            updatedAt: sota_common_1.Utils.nowInMillis(),
                            seedLocalTxId: localTx.id,
                            collectStatus: Enums_1.CollectStatus.SEEDING,
                        })];
                case 13:
                    _b.sent();
                    return [4, manager.insert(entities_1.DepositLog, {
                            depositId: seedDeposit.id,
                            event: Enums_1.DepositEvent.SEEDING,
                            refId: seedDeposit.id,
                            data: rawTx.txid,
                            createdAt: sota_common_1.Utils.nowInMillis(),
                        })];
                case 14:
                    _b.sent();
                    logger.info("Seed queued address=" + seedDeposit.toAddress);
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=feeSeederDoProcess.js.map