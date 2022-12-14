"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.WebhookProcessor = void 0;
var axios_1 = __importDefault(require("axios"));
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Enums_1 = require("./Enums");
var entities_1 = require("./entities");
var rawdb = __importStar(require("./rawdb"));
var logger = sota_common_1.getLogger('WebhookProcessor');
var WebhookProcessor = (function (_super) {
    __extends(WebhookProcessor, _super);
    function WebhookProcessor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._nextTickTimer = 10000;
        return _this;
    }
    WebhookProcessor.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2];
            });
        });
    };
    WebhookProcessor.prototype.doProcess = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        var e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4, this._doProcess(manager)];
                                case 1:
                                    _a.sent();
                                    return [3, 3];
                                case 2:
                                    e_1 = _a.sent();
                                    logger.error("WebhookProcessor do process failed with error");
                                    logger.error(e_1);
                                    return [3, 3];
                                case 3: return [2];
                            }
                        });
                    }); })];
            });
        });
    };
    WebhookProcessor.prototype._doProcess = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var maxRetryCount, maxRecordsToProcess, progressRecords;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxRetryCount = parseInt(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_PROGRESS_RETRY_COUNT')) || 5;
                        maxRecordsToProcess = parseInt(sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_RECORDS_TO_PROCESS')) || 100;
                        return [4, manager.getRepository(entities_1.WebhookProgress).find({
                                where: { isProcessed: false, retryCount: typeorm_1.LessThanOrEqual(maxRetryCount) },
                                order: { updatedAt: 'ASC' },
                                take: maxRecordsToProcess,
                            })];
                    case 1:
                        progressRecords = _a.sent();
                        if (!progressRecords.length) {
                            logger.debug("No pending webhook to call. Let's wait for the next tick...");
                            return [2];
                        }
                        return [4, Promise.all(progressRecords.map(function (record) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2, this._processRecord(record, manager)];
                            }); }); }))];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    WebhookProcessor.prototype._processRecord = function (progressRecord, manager) {
        return __awaiter(this, void 0, void 0, function () {
            var webhookId, webhookRecord, url, now, type, refId, event, data, body, username, password, isAuthIgnored, basicAuth, headers, timeout, status, msg, resp, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        webhookId = progressRecord.webhookId;
                        return [4, manager.getRepository(entities_1.Webhook).findOne(webhookId)];
                    case 1:
                        webhookRecord = _a.sent();
                        if (!webhookRecord) {
                            throw new Error("Progress <" + progressRecord.id + "> has invalid webhook id: " + webhookId);
                        }
                        url = webhookRecord.url;
                        if (!url) {
                            logger.error("Webhook <" + webhookId + "> has invalid url: " + url);
                            return [2];
                        }
                        now = sota_common_1.Utils.nowInMillis();
                        type = progressRecord.type;
                        refId = progressRecord.refId;
                        event = progressRecord.event;
                        return [4, this._getRefData(manager, type, refId, webhookRecord.userId)];
                    case 2:
                        data = _a.sent();
                        body = JSON.stringify({ type: type, event: event, data: data });
                        username = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_USER');
                        password = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_PASSWORD');
                        isAuthIgnored = false;
                        if (!username || !password) {
                            isAuthIgnored = true;
                        }
                        basicAuth = Buffer.from(username + ":" + password).toString('base64');
                        headers = {
                            'Content-Type': 'application/json',
                            Authorization: isAuthIgnored ? undefined : "Basic " + basicAuth,
                        };
                        timeout = 5000;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4, axios_1.default.post(url, { type: type, event: event, data: data }, { headers: headers, timeout: timeout })];
                    case 4:
                        resp = _a.sent();
                        status = resp.status;
                        msg = resp.statusText || JSON.stringify(resp.data);
                        if (status === 200) {
                            progressRecord.isProcessed = true;
                        }
                        else {
                            progressRecord.retryCount += 1;
                            progressRecord.isProcessed = false;
                        }
                        logger.info("Webhook called: url=" + url + " method=POST body=" + body + " headers=" + JSON.stringify(headers) + " response=" + msg + " status=" + status);
                        return [3, 6];
                    case 5:
                        err_1 = _a.sent();
                        logger.error("Webhook called failed: url=" + url + " method=POST body=" + body + " headers=" + JSON.stringify(headers) + " error=" + err_1);
                        status = 0;
                        msg = err_1.toString();
                        progressRecord.retryCount += 1;
                        progressRecord.isProcessed = false;
                        return [3, 6];
                    case 6:
                        progressRecord.updatedAt = now;
                        return [4, sota_common_1.Utils.PromiseAll([
                                rawdb.insertWebhookLog(manager, progressRecord.id, url, body, status, msg),
                                manager.getRepository(entities_1.WebhookProgress).save(progressRecord),
                            ])];
                    case 7:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    WebhookProcessor.prototype._getRefData = function (manager, type, refId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, _a, currency, userCurrency, localTx, currency, userCurrency, localTx;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = type;
                        switch (_a) {
                            case Enums_1.WebhookType.DEPOSIT: return [3, 1];
                            case Enums_1.WebhookType.WITHDRAWAL: return [3, 6];
                        }
                        return [3, 11];
                    case 1: return [4, manager.getRepository(entities_1.Deposit).findOne(refId)];
                    case 2:
                        data = _b.sent();
                        if (!data) {
                            throw new Error("Could not find deposit id=" + refId);
                        }
                        currency = sota_common_1.CurrencyRegistry.getOneCurrency(data.currency);
                        data.platform = currency.platform;
                        return [4, manager.getRepository(entities_1.UserCurrency).findOne({ userId: userId, systemSymbol: data.currency })];
                    case 3:
                        userCurrency = _b.sent();
                        if (userCurrency) {
                            data.currency = userCurrency.customSymbol;
                        }
                        else {
                            data.currency = currency.networkSymbol;
                        }
                        if (!(data.status === Enums_1.CollectStatus.COLLECTED)) return [3, 5];
                        return [4, manager.getRepository(entities_1.LocalTx).findOne({ txid: data.txid, status: Enums_1.LocalTxStatus.COMPLETED })];
                    case 4:
                        localTx = _b.sent();
                        data.transactionFee = localTx === null || localTx === void 0 ? void 0 : localTx.feeAmount;
                        _b.label = 5;
                    case 5: return [2, data];
                    case 6: return [4, manager.getRepository(entities_1.Withdrawal).findOne(refId)];
                    case 7:
                        data = _b.sent();
                        if (!data) {
                            throw new Error("Could not find withdrawal id=" + refId);
                        }
                        currency = sota_common_1.CurrencyRegistry.getOneCurrency(data.currency);
                        data.platform = currency.platform;
                        return [4, manager.getRepository(entities_1.UserCurrency).findOne({ userId: userId, systemSymbol: data.currency })];
                    case 8:
                        userCurrency = _b.sent();
                        if (userCurrency) {
                            data.currency = userCurrency.customSymbol;
                        }
                        else {
                            data.currency = currency.networkSymbol;
                        }
                        if (!(data.status === Enums_1.WithdrawalStatus.COMPLETED)) return [3, 10];
                        return [4, manager.getRepository(entities_1.LocalTx).findOne({ txid: data.txid, status: Enums_1.LocalTxStatus.COMPLETED })];
                    case 9:
                        localTx = _b.sent();
                        data.transactionFee = localTx === null || localTx === void 0 ? void 0 : localTx.feeAmount;
                        _b.label = 10;
                    case 10: return [2, data];
                    case 11: throw new Error("Could not build webhook data for invalid type: " + type);
                }
            });
        });
    };
    return WebhookProcessor;
}(sota_common_1.BaseIntervalWorker));
exports.WebhookProcessor = WebhookProcessor;
//# sourceMappingURL=WebhookProcessor.js.map