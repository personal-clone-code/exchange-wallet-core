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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var sota_common_1 = require("sota-common");
var rawdb = __importStar(require("../../rawdb"));
var typeorm_1 = require("typeorm");
var Enums_1 = require("../../Enums");
var util_1 = __importDefault(require("util"));
var logger = sota_common_1.getLogger('senderDoProcess');
function senderDoProcess(sender) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _senderDoProcess(manager, sender)];
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
exports.senderDoProcess = senderDoProcess;
function _senderDoProcess(manager, sender) {
    return __awaiter(this, void 0, void 0, function () {
        var platformCurrency, allCurrencies, allSymbols, signedRecord, currency, gateway, sentResultObj, prefix, txid, status_1, e_1, status_2, e_2, errInfo, extraInfo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platformCurrency = sender.getCurrency();
                    allCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
                    allSymbols = allCurrencies.map(function (c) { return c.symbol; });
                    return [4, rawdb.findOneLocalTx(manager, allSymbols, [Enums_1.LocalTxStatus.SIGNED])];
                case 1:
                    signedRecord = _a.sent();
                    if (!signedRecord) {
                        logger.info("There are not signed localTx to be sent: platform=" + platformCurrency.platform);
                        return [2];
                    }
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(signedRecord.currency);
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    sentResultObj = null;
                    prefix = 'TMP_';
                    txid = signedRecord.txid;
                    if (!(signedRecord.txid.indexOf(prefix) === -1)) return [3, 9];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 8, , 9]);
                    return [4, gateway.getTransactionStatus(txid)];
                case 3:
                    status_1 = _a.sent();
                    if (!(status_1 === sota_common_1.TransactionStatus.COMPLETED || status_1 === sota_common_1.TransactionStatus.CONFIRMING)) return [3, 5];
                    return [4, updateLocalTxAndRelatedTables(manager, signedRecord, txid, Enums_1.LocalTxStatus.SENT)];
                case 4:
                    _a.sent();
                    return [2];
                case 5:
                    if (!(status_1 === sota_common_1.TransactionStatus.FAILED)) return [3, 7];
                    return [4, updateLocalTxAndRelatedTables(manager, signedRecord, txid, Enums_1.LocalTxStatus.FAILED)];
                case 6:
                    _a.sent();
                    return [2];
                case 7: return [3, 9];
                case 8:
                    e_1 = _a.sent();
                    status_2 = sota_common_1.TransactionStatus.UNKNOWN;
                    return [3, 9];
                case 9:
                    _a.trys.push([9, 11, , 14]);
                    return [4, gateway.sendRawTransaction(signedRecord.signedRaw)];
                case 10:
                    sentResultObj = _a.sent();
                    return [3, 14];
                case 11:
                    e_2 = _a.sent();
                    errInfo = e_2;
                    extraInfo = null;
                    if (e_2.isAxiosError) {
                        extraInfo = {
                            url: e_2.config.url,
                            method: e_2.config.method,
                            data: e_2.config.data,
                            headers: e_2.config.headers,
                            auth: e_2.config.auth,
                            timeout: e_2.config.timeout,
                            status: e_2.response.status,
                        };
                        errInfo = JSON.stringify(e_2.response.data);
                    }
                    logger.error("Cannot broadcast localTxId=" + signedRecord.id + " due to error        errInfo=" + util_1.default.inspect(errInfo) + "         extraInfo=" + util_1.default.inspect(extraInfo));
                    if (!errInfo.toString().includes('nonce too low')) return [3, 13];
                    return [4, reconstructLocalTx(manager, signedRecord)];
                case 12:
                    _a.sent();
                    _a.label = 13;
                case 13: return [2];
                case 14:
                    if (!sentResultObj) return [3, 16];
                    return [4, updateLocalTxAndRelatedTables(manager, signedRecord, sentResultObj.txid, Enums_1.LocalTxStatus.SENT)];
                case 15:
                    _a.sent();
                    return [2];
                case 16:
                    logger.error("Could not send raw transaction localTxId=" + signedRecord.id + ". Result is empty, please check...");
                    _a.label = 17;
                case 17: return [2];
            }
        });
    });
}
function updateLocalTxAndRelatedTables(manager, localTx, txid, status) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(status === Enums_1.LocalTxStatus.FAILED)) return [3, 2];
                    return [4, reconstructLocalTx(manager, localTx, { txid: txid })];
                case 1:
                    _a.sent();
                    return [2];
                case 2:
                    logger.info("senderDoProcess: broadcast tx to network successfully: " + txid);
                    return [4, rawdb.updateLocalTxStatus(manager, localTx.id, Enums_1.LocalTxStatus.SENT, { txid: txid })];
                case 3:
                    _a.sent();
                    if (!(localTx.isWithdrawal() || localTx.isWithdrawalCollect())) return [3, 5];
                    return [4, rawdb.updateWithdrawalsStatus(manager, localTx.id, Enums_1.WithdrawalStatus.SENT, Enums_1.WithdrawalEvent.SENT, {
                            txid: txid,
                        })];
                case 4:
                    _a.sent();
                    return [3, 10];
                case 5:
                    if (!localTx.isCollectTx()) return [3, 7];
                    return [4, rawdb.updateDepositCollectStatusByCollectTxId(manager, localTx, Enums_1.CollectStatus.COLLECT_SENT, Enums_1.DepositEvent.COLLECT_SENT)];
                case 6:
                    _a.sent();
                    return [3, 10];
                case 7:
                    if (!localTx.isSeedTx()) return [3, 9];
                    return [4, rawdb.updateDepositCollectStatusBySeedTxId(manager, localTx, Enums_1.CollectStatus.SEED_SENT, Enums_1.DepositEvent.SEED_SENT)];
                case 8:
                    _a.sent();
                    return [3, 10];
                case 9: throw new Error("Not support localTxType: " + localTx.type);
                case 10: return [2];
            }
        });
    });
}
function reconstructLocalTx(manager, localTx, txResult) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rawdb.updateLocalTxStatus(manager, localTx.id, Enums_1.LocalTxStatus.FAILED)];
                case 1:
                    _a.sent();
                    if (!(localTx.isWithdrawal() || localTx.isWithdrawalCollect())) return [3, 3];
                    return [4, rawdb.updateWithdrawalsStatus(manager, localTx.id, Enums_1.WithdrawalStatus.UNSIGNED, Enums_1.WithdrawalEvent.TXID_CHANGED, txResult)];
                case 2:
                    _a.sent();
                    return [3, 8];
                case 3:
                    if (!localTx.isCollectTx()) return [3, 5];
                    return [4, rawdb.updateDepositCollectStatusByCollectTxId(manager, localTx, Enums_1.CollectStatus.UNCOLLECTED, Enums_1.DepositEvent.COLLECT_TXID_CHANGED)];
                case 4:
                    _a.sent();
                    return [3, 8];
                case 5:
                    if (!localTx.isSeedTx()) return [3, 7];
                    return [4, rawdb.updateDepositCollectStatusBySeedTxId(manager, localTx, Enums_1.CollectStatus.SEED_REQUESTED, Enums_1.DepositEvent.SEED_TXID_CHANGED)];
                case 6:
                    _a.sent();
                    return [3, 8];
                case 7: throw new Error("Not support localTxType: " + localTx.type);
                case 8: return [2];
            }
        });
    });
}
//# sourceMappingURL=senderDoProcess.js.map