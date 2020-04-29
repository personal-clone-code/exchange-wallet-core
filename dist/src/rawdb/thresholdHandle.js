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
var sota_common_1 = require("sota-common");
var rawdb = __importStar(require("."));
var Enums_1 = require("../Enums");
var entities_1 = require("../entities");
var findHotWallets_1 = require("./findHotWallets");
var nodemailer = require('nodemailer');
var logger = sota_common_1.getLogger('ThresholdHandle');
function checkUpperThreshold(manager, platform) {
    return __awaiter(this, void 0, void 0, function () {
        var allCurrencies, wallets;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    allCurrencies = sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(platform);
                    return [4, manager.getRepository(entities_1.Wallet).find({
                            where: {
                                currency: platform,
                            },
                        })];
                case 1:
                    wallets = _a.sent();
                    return [4, Promise.all(wallets.map(function (wallet) { return __awaiter(_this, void 0, void 0, function () {
                            var hotWallets;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, rawdb.findFreeHotWallets(manager, wallet.id, platform)];
                                    case 1:
                                        hotWallets = _a.sent();
                                        return [4, Promise.all(allCurrencies.map(function (_currency) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4, Promise.all(hotWallets.map(function (_hotWallet) { return rawdb.upperThresholdHandle(manager, _currency, _hotWallet); }))];
                                                    case 1: return [2, _a.sent()];
                                                }
                                            }); }); }))];
                                    case 2:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.checkUpperThreshold = checkUpperThreshold;
function upperThresholdHandle(manager, iCurrency, hotWallet) {
    return __awaiter(this, void 0, void 0, function () {
        var pendingStatuses, walletBalance, currencyConfig, sameWallet, coldWallet, upper, lower, middle, gateway, currency, balance, pending, withdrawal, amount, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pendingStatuses = [Enums_1.WithdrawalStatus.SENT, Enums_1.WithdrawalStatus.SIGNED, Enums_1.WithdrawalStatus.SIGNING];
                    return [4, rawdb.checkHotWalletIsBusy(manager, hotWallet, pendingStatuses, iCurrency.platform)];
                case 1:
                    if (_b.sent()) {
                        logger.info("Hot wallet address=" + hotWallet.address + " is busy, ignore collecting");
                        return [2];
                    }
                    return [4, manager.findOne(entities_1.WalletBalance, {
                            walletId: hotWallet.walletId,
                            currency: iCurrency.symbol,
                        })];
                case 2:
                    walletBalance = _b.sent();
                    if (!walletBalance) {
                        logger.error("Wallet id=" + hotWallet.walletId + " is not found");
                        return [2];
                    }
                    return [4, rawdb.findOneCurrency(manager, iCurrency.symbol, hotWallet.walletId)];
                case 3:
                    currencyConfig = _b.sent();
                    if (!currencyConfig) {
                        logger.error("Currency threshold symbol=" + iCurrency.symbol + " is not found");
                        return [2];
                    }
                    return [4, rawdb.findColdWalletByAddress(manager, hotWallet.address)];
                case 4:
                    sameWallet = _b.sent();
                    if (sameWallet) {
                        logger.info("Hot wallet symbol=" + iCurrency.symbol + " address=" + hotWallet.address + " is registered as a cold wallet. Ignore collecting");
                        return [2];
                    }
                    return [4, rawdb.findAnyColdWallet(manager, hotWallet.walletId, hotWallet.currency)];
                case 5:
                    coldWallet = _b.sent();
                    if (!coldWallet) {
                        logger.warn("Cold wallet symbol=" + hotWallet.currency + " is not found, ignore forwarding");
                        return [2];
                    }
                    upper = new sota_common_1.BigNumber(currencyConfig.upperThreshold);
                    lower = new sota_common_1.BigNumber(currencyConfig.lowerThreshold);
                    if (!currencyConfig.middleThreshold) {
                        middle = upper.plus(lower).div(new sota_common_1.BigNumber(2));
                    }
                    else {
                        middle = new sota_common_1.BigNumber(currencyConfig.middleThreshold);
                    }
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(iCurrency.symbol);
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(iCurrency.symbol);
                    return [4, gateway.getAddressBalance(hotWallet.address)];
                case 6:
                    balance = _b.sent();
                    return [4, rawdb.findWithdrawalsPendingBalance(manager, hotWallet.walletId, hotWallet.userId, iCurrency.symbol, hotWallet.address)];
                case 7:
                    pending = _b.sent();
                    balance = balance.minus(pending);
                    if (upper.eq(0) || balance.lt(upper)) {
                        logger.info("Hot wallet symbol=" + iCurrency.symbol + " address=" + hotWallet.address + " is not in upper threshold, ignore collecting");
                        return [2];
                    }
                    withdrawal = new entities_1.Withdrawal();
                    amount = balance.minus(middle).toFixed(currency.nativeScale);
                    withdrawal.currency = iCurrency.symbol;
                    withdrawal.fromAddress = hotWallet.address;
                    withdrawal.memo = 'FROM_MACHINE';
                    withdrawal.amount = amount;
                    withdrawal.userId = hotWallet.userId;
                    _a = withdrawal;
                    return [4, findHotWallets_1.getWithdrawalMode(manager, hotWallet.walletId)];
                case 8:
                    _a.type = (_b.sent()) + Enums_1.WithdrawOutType.WITHDRAW_OUT_COLD_SUFFIX;
                    withdrawal.walletId = hotWallet.walletId;
                    withdrawal.toAddress = coldWallet.address;
                    withdrawal.status = Enums_1.WithdrawalStatus.UNSIGNED;
                    return [4, manager.save(withdrawal)];
                case 9:
                    _b.sent();
                    return [2];
            }
        });
    });
}
exports.upperThresholdHandle = upperThresholdHandle;
function lowerThresholdHandle(manager, sentRecord) {
    return __awaiter(this, void 0, void 0, function () {
        var hotWallet, currencyConfig, lower, gateway, balance, pending, appName, sender, senderName, receiver;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rawdb.findHotWalletByAddress(manager, sentRecord.fromAddress)];
                case 1:
                    hotWallet = _a.sent();
                    if (!hotWallet) {
                        logger.error("hotWallet address=" + sentRecord.fromAddress + " not found");
                        return [2];
                    }
                    return [4, rawdb.findOneCurrency(manager, sentRecord.currency, sentRecord.walletId)];
                case 2:
                    currencyConfig = _a.sent();
                    if (!currencyConfig || !currencyConfig.lowerThreshold) {
                        logger.error("Currency threshold symbol=" + sentRecord.currency + " is not found or lower threshold is not setted");
                        return [2];
                    }
                    lower = new sota_common_1.BigNumber(currencyConfig.lowerThreshold);
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(sentRecord.currency);
                    return [4, gateway.getAddressBalance(hotWallet.address)];
                case 3:
                    balance = _a.sent();
                    return [4, rawdb.findWithdrawalsPendingBalance(manager, hotWallet.walletId, hotWallet.userId, sentRecord.currency, hotWallet.address)];
                case 4:
                    pending = _a.sent();
                    balance = balance.minus(pending);
                    if (lower.eq(0) || balance.gt(lower)) {
                        logger.info("Hot wallet symbol=" + sentRecord.currency + " address=" + hotWallet.address + " is not in lower threshold, ignore notifying");
                        return [2];
                    }
                    logger.info("Hot wallet balance is in lower threshold address=" + hotWallet.address);
                    appName = process.env.APP_NAME || 'Exchange Wallet';
                    sender = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_ADDRESS');
                    senderName = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_NAME');
                    receiver = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_RECIPIENT_COLD_WALLET');
                    if (!receiver || !sota_common_1.Utils.isValidEmail(receiver)) {
                        logger.error("Mailer could not send email to receiver=" + receiver + ". Please check it.");
                        return [2];
                    }
                    return [4, rawdb.insertMailJob(manager, {
                            senderAddress: sender,
                            senderName: senderName,
                            recipientAddress: receiver,
                            title: "[" + appName + "] Hot wallet " + hotWallet.address + " is near lower threshold",
                            templateName: 'hot_wallet_balance_lower_threshold_layout.hbs',
                            content: {
                                lower_threshold: lower,
                                current_balance: balance,
                                address: hotWallet.address,
                                currency: sentRecord.currency,
                            },
                        })];
                case 5:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.lowerThresholdHandle = lowerThresholdHandle;
function checkHotWalletIsSufficient(hotWallet, currency, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var gateway, hotWalletBalance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, gateway.getAddressBalance(hotWallet.address)];
                case 1:
                    hotWalletBalance = _a.sent();
                    logger.debug("checkHotWalletIsSufficient: wallet=" + hotWallet.address + " amount=" + amount + " balance=" + hotWalletBalance);
                    if (hotWalletBalance.gte(amount)) {
                        return [2, true];
                    }
                    return [2, false];
            }
        });
    });
}
exports.checkHotWalletIsSufficient = checkHotWalletIsSufficient;
function checkAddressIsSufficient(address, currency, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var gateway, hotWalletBalance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, gateway.getAddressBalance(address.address)];
                case 1:
                    hotWalletBalance = _a.sent();
                    logger.debug("checkAddressSufficient: wallet=" + address.address + " amount=" + amount + " balance=" + hotWalletBalance);
                    if (hotWalletBalance.gte(amount)) {
                        return [2, true];
                    }
                    return [2, false];
            }
        });
    });
}
exports.checkAddressIsSufficient = checkAddressIsSufficient;
//# sourceMappingURL=thresholdHandle.js.map