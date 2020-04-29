"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = __importStar(require("lodash"));
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var entities_1 = require("../entities");
var logger = sota_common_1.getLogger('DBTools::# UserCurrency::');
function doCheckUserCurrency() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _doCheckUserCurrency(manager)];
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
exports.doCheckUserCurrency = doCheckUserCurrency;
function _doCheckUserCurrency(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var userCurrencyErrors, users, currencyConfigs, tasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    logger.info("Start checking...");
                    userCurrencyErrors = [];
                    return [4, manager.getRepository(entities_1.User).find()];
                case 1:
                    users = _a.sent();
                    if (!users || users.length === 0) {
                        logger.warn("There're no users. So, skipping.");
                        return [2];
                    }
                    return [4, manager.getRepository(entities_1.CurrencyConfig).find()];
                case 2:
                    currencyConfigs = _a.sent();
                    if (!currencyConfigs || currencyConfigs.length === 0) {
                        logger.warn("There're no currency configs. So, skipping.");
                        return [2];
                    }
                    tasks = _.map(users, function (user) { return __awaiter(_this, void 0, void 0, function () {
                        var subTasks;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    subTasks = _.map(currencyConfigs, function (config) { return __awaiter(_this, void 0, void 0, function () {
                                        var currenciesOfPlatform, tokensOfPlatform, tokenTasks;
                                        var _this = this;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    currenciesOfPlatform = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(config.currency);
                                                    tokensOfPlatform = _.map(currenciesOfPlatform, function (currency) { return (!currency.isNative ? currency : null); });
                                                    tokensOfPlatform = _.compact(tokensOfPlatform);
                                                    tokenTasks = _.map(tokensOfPlatform, function (token) { return __awaiter(_this, void 0, void 0, function () {
                                                        var result;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0: return [4, manager.getRepository(entities_1.UserCurrency).findOne({
                                                                        userId: user.id,
                                                                        systemSymbol: token.symbol,
                                                                    })];
                                                                case 1:
                                                                    result = _a.sent();
                                                                    if (!result) {
                                                                        userCurrencyErrors.push("There's no user currency for user " + user.id + " (" + token.symbol + ")");
                                                                    }
                                                                    return [2];
                                                            }
                                                        });
                                                    }); });
                                                    return [4, Promise.all(tokenTasks)];
                                                case 1:
                                                    _a.sent();
                                                    return [2];
                                            }
                                        });
                                    }); });
                                    return [4, Promise.all(subTasks)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); });
                    return [4, Promise.all(tasks)];
                case 3:
                    _a.sent();
                    logger.info("" + JSON.stringify({
                        isOK: userCurrencyErrors.length === 0,
                        totalErrors: userCurrencyErrors.length,
                        details: userCurrencyErrors,
                    }));
                    logger.info("Finished!");
                    logger.info("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=doCheckUserCurrency.js.map