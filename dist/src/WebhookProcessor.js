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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = __importDefault(require("node-fetch"));
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
            var progressRecord, webhookId, webhookRecord, url, now, type, refId, event, data, method, body, username, password, basicAuth, headers, timeout, status, msg, resp, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, manager.getRepository(entities_1.WebhookProgress).findOne({ isProcessed: false }, {
                            order: { updatedAt: 'ASC' },
                        })];
                    case 1:
                        progressRecord = _a.sent();
                        if (!progressRecord) {
                            logger.debug("No pending webhook to call. Let's wait for the next tick...");
                            return [2];
                        }
                        webhookId = progressRecord.webhookId;
                        return [4, manager.getRepository(entities_1.Webhook).findOne(webhookId)];
                    case 2:
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
                    case 3:
                        data = _a.sent();
                        method = 'POST';
                        body = JSON.stringify({ type: type, event: event, data: data });
                        username = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_USER');
                        password = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('WEBHOOK_REQUEST_PASSWORD');
                        if (!username || !password) {
                            throw new Error("Webhook authorization is missing. Please check your config.");
                        }
                        basicAuth = Buffer.from(username + ":" + password).toString('base64');
                        headers = {
                            'Content-Type': 'application/json',
                            Authorization: "Basic " + basicAuth,
                        };
                        timeout = 5000;
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4, node_fetch_1.default(url, { method: method, body: body, headers: headers, timeout: timeout })];
                    case 5:
                        resp = _a.sent();
                        status = resp.status;
                        msg = resp.statusText || JSON.stringify(resp.json());
                        if (status === 200) {
                            progressRecord.isProcessed = true;
                        }
                        else {
                            progressRecord.isProcessed = false;
                        }
                        return [3, 7];
                    case 6:
                        err_1 = _a.sent();
                        status = 0;
                        msg = err_1.toString();
                        progressRecord.isProcessed = false;
                        return [3, 7];
                    case 7:
                        progressRecord.updatedAt = now;
                        return [4, sota_common_1.Utils.PromiseAll([
                                rawdb.insertWebhookLog(manager, progressRecord.id, url, body, status, msg),
                                manager.getRepository(entities_1.WebhookProgress).save(progressRecord),
                            ])];
                    case 8:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    WebhookProcessor.prototype._getRefData = function (manager, type, refId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, _a, userCurrency, currency, userCurrency, currency;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = type;
                        switch (_a) {
                            case Enums_1.WebhookType.DEPOSIT: return [3, 1];
                            case Enums_1.WebhookType.WITHDRAWAL: return [3, 4];
                        }
                        return [3, 7];
                    case 1: return [4, manager.getRepository(entities_1.Deposit).findOne(refId)];
                    case 2:
                        data = _b.sent();
                        if (!data) {
                            throw new Error("Could not find deposit id=" + refId);
                        }
                        return [4, manager.getRepository(entities_1.UserCurrency).findOne({ userId: userId, systemSymbol: data.currency })];
                    case 3:
                        userCurrency = _b.sent();
                        if (userCurrency) {
                            data.currency = userCurrency.customSymbol;
                        }
                        else {
                            currency = sota_common_1.CurrencyRegistry.getOneCurrency(data.currency);
                            data.currency = currency.networkSymbol;
                        }
                        return [2, data];
                    case 4: return [4, manager.getRepository(entities_1.Withdrawal).findOne(refId)];
                    case 5:
                        data = _b.sent();
                        if (!data) {
                            throw new Error("Could not find withdrawal id=" + refId);
                        }
                        return [4, manager.getRepository(entities_1.UserCurrency).findOne({ userId: userId, systemSymbol: data.currency })];
                    case 6:
                        userCurrency = _b.sent();
                        if (userCurrency) {
                            data.currency = userCurrency.customSymbol;
                        }
                        else {
                            currency = sota_common_1.CurrencyRegistry.getOneCurrency(data.currency);
                            data.currency = currency.networkSymbol;
                        }
                        return [2, data];
                    case 7: throw new Error("Could not build webhook data for invalid type: " + type);
                }
            });
        });
    };
    return WebhookProcessor;
}(sota_common_1.BaseIntervalWorker));
exports.WebhookProcessor = WebhookProcessor;
//# sourceMappingURL=WebhookProcessor.js.map