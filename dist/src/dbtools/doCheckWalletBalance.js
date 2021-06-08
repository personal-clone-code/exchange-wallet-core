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
exports.doCheckWalletBalance = void 0;
var _ = __importStar(require("lodash"));
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var limit = 500;
var logger = sota_common_1.getLogger('DBTools::# WalletBalance::');
function doCheckWalletBalance() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _doCheckWalletBalance(manager)];
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
exports.doCheckWalletBalance = doCheckWalletBalance;
function _doCheckWalletBalance(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var walletBalanceErrors, wallets, tasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    logger.info("Start checking...");
                    walletBalanceErrors = [];
                    return [4, manager.getRepository(entities_1.Wallet).find()];
                case 1:
                    wallets = _a.sent();
                    if (!wallets || wallets.length === 0) {
                        logger.warn("There're no wallets. So, skipping.");
                        return [2];
                    }
                    tasks = _.map(wallets, function (wallet) { return __awaiter(_this, void 0, void 0, function () {
                        var currenciesOfPlatform, balanceTasks;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    currenciesOfPlatform = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(wallet.currency);
                                    if (wallet.currency === sota_common_1.BlockchainPlatform.Ethereum) {
                                        currenciesOfPlatform.push.apply(currenciesOfPlatform, sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(sota_common_1.BlockchainPlatform.BinanceSmartChain));
                                    }
                                    balanceTasks = _.map(currenciesOfPlatform, function (currency) { return __awaiter(_this, void 0, void 0, function () {
                                        var walletBalance, totalWalletLogs, totalBalanceLogs_1, totlaRound, round, _i, round_1, r, walletLogs;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4, manager.getRepository(entities_1.WalletBalance).findOne({
                                                        walletId: wallet.id,
                                                        currency: currency.symbol,
                                                    })];
                                                case 1:
                                                    walletBalance = _a.sent();
                                                    if (!walletBalance) return [3, 7];
                                                    return [4, manager.getRepository(entities_1.WalletLog).count({
                                                            walletId: wallet.id,
                                                            currency: currency.symbol,
                                                        })];
                                                case 2:
                                                    totalWalletLogs = _a.sent();
                                                    totalBalanceLogs_1 = new sota_common_1.BigNumber(0);
                                                    totlaRound = Math.ceil(totalWalletLogs / limit);
                                                    round = Array.from(Array(totlaRound).keys());
                                                    _i = 0, round_1 = round;
                                                    _a.label = 3;
                                                case 3:
                                                    if (!(_i < round_1.length)) return [3, 6];
                                                    r = round_1[_i];
                                                    return [4, manager.getRepository(entities_1.WalletLog).find({
                                                            where: {
                                                                walletId: wallet.id,
                                                                currency: currency.symbol,
                                                            },
                                                            take: limit,
                                                            skip: r * limit,
                                                        })];
                                                case 4:
                                                    walletLogs = _a.sent();
                                                    if (walletLogs && walletLogs.length !== 0) {
                                                        walletLogs = _.map(walletLogs, function (w) { return (w.event !== Enums_1.WalletEvent.WITHDRAW_REQUEST ? w : null); });
                                                        walletLogs = _.compact(walletLogs);
                                                        _.map(walletLogs, function (log) {
                                                            totalBalanceLogs_1 = totalBalanceLogs_1.plus(log.balanceChange);
                                                        });
                                                    }
                                                    _a.label = 5;
                                                case 5:
                                                    _i++;
                                                    return [3, 3];
                                                case 6:
                                                    if (!new sota_common_1.BigNumber(walletBalance.balance).eq(totalBalanceLogs_1)) {
                                                        walletBalanceErrors.push("Wallet " + wallet.id + " (" + currency.symbol + ") has wrong balance. Got " + walletBalance.balance + ", expected " + totalBalanceLogs_1);
                                                    }
                                                    return [3, 8];
                                                case 7:
                                                    walletBalanceErrors.push("Wallet " + wallet.id + " (" + currency.symbol + ") does not have wallet balance");
                                                    _a.label = 8;
                                                case 8: return [2];
                                            }
                                        });
                                    }); });
                                    return [4, Promise.all(balanceTasks)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); });
                    return [4, Promise.all(tasks)];
                case 2:
                    _a.sent();
                    logger.info("" + JSON.stringify({
                        isOK: walletBalanceErrors.length === 0,
                        totalErrors: walletBalanceErrors.length,
                        details: walletBalanceErrors,
                    }));
                    logger.info("Finished!");
                    logger.info("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=doCheckWalletBalance.js.map