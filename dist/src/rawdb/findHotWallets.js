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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHotWalletIsBusy = exports.getOneHotWallet = exports.getAllBusyHotWallets = exports.findAnyExternalHotWallet = exports.findAnyInternalHotWallet = exports.findAnyColdWallet = exports.findAnyRallyWallet = exports.findOneCurrency = exports.getWithdrawalMode = exports.findColdWalletByAddress = exports.findHotWalletByAddress = exports.findAnyHotWallet = exports.findFreeHotWallets = exports.findSufficientHotWallet = void 0;
var lodash_1 = __importDefault(require("lodash"));
var typeorm_1 = require("typeorm");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var sota_common_1 = require("sota-common");
var logger = sota_common_1.getLogger('rawdb::findHotWallets');
var DEFAULT_WITHDRAWAL_MODE = 'normal';
function findSufficientHotWallet(manager, walletId, currency, amount, type) {
    return __awaiter(this, void 0, void 0, function () {
        var platform, hotWallets, foundHotWallet, gateway;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platform = currency.family || currency.platform;
                    return [4, findFreeHotWallets(manager, walletId, platform)];
                case 1:
                    hotWallets = _a.sent();
                    if (!hotWallets.length) {
                        return [2, null];
                    }
                    foundHotWallet = null;
                    gateway = sota_common_1.GatewayRegistry.getGatewayInstance(currency);
                    return [4, Promise.all(hotWallets.map(function (hotWallet) { return __awaiter(_this, void 0, void 0, function () {
                            var hotWalletBalance;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, gateway.getAddressBalance(hotWallet.address)];
                                    case 1:
                                        hotWalletBalance = _a.sent();
                                        if (hotWallet.type === type && hotWalletBalance.gte(amount)) {
                                            foundHotWallet = hotWallet;
                                        }
                                        return [2];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    if (!foundHotWallet) {
                        logger.error("No sufficient hot wallet walletId=" + walletId + " currency=" + currency.symbol + " amount=" + amount.toString());
                    }
                    return [2, foundHotWallet];
            }
        });
    });
}
exports.findSufficientHotWallet = findSufficientHotWallet;
function findFreeHotWallets(manager, walletId, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var isExternal, hotWallets, busyAddresses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isExternal = false;
                    return [4, manager.find(entities_1.HotWallet, {
                            walletId: walletId,
                            currency: currency,
                            isExternal: isExternal,
                        })];
                case 1:
                    hotWallets = _a.sent();
                    if (!hotWallets.length) {
                        return [2, []];
                    }
                    return [4, getAllBusyHotWallets(manager, walletId)];
                case 2:
                    busyAddresses = _a.sent();
                    return [2, hotWallets.filter(function (hotWallet) { return !lodash_1.default.includes(busyAddresses, hotWallet.address); })];
            }
        });
    });
}
exports.findFreeHotWallets = findFreeHotWallets;
function findAnyHotWallet(manager, walletId, currency, isExternal) {
    return __awaiter(this, void 0, void 0, function () {
        var hotWallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.HotWallet, {
                        walletId: walletId,
                        currency: currency,
                        isExternal: isExternal,
                    })];
                case 1:
                    hotWallet = _a.sent();
                    return [2, hotWallet];
            }
        });
    });
}
exports.findAnyHotWallet = findAnyHotWallet;
function findHotWalletByAddress(manager, address) {
    return __awaiter(this, void 0, void 0, function () {
        var hotWallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.HotWallet, {
                        address: address,
                    })];
                case 1:
                    hotWallet = _a.sent();
                    return [2, hotWallet];
            }
        });
    });
}
exports.findHotWalletByAddress = findHotWalletByAddress;
function findColdWalletByAddress(manager, address) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.ColdWallet, {
                        address: address,
                    })];
                case 1:
                    wallet = _a.sent();
                    return [2, wallet];
            }
        });
    });
}
exports.findColdWalletByAddress = findColdWalletByAddress;
function getWithdrawalMode(manager, walletId) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.Wallet, {
                        id: walletId,
                    })];
                case 1:
                    wallet = _a.sent();
                    return [2, wallet.withdrawalMode || DEFAULT_WITHDRAWAL_MODE];
            }
        });
    });
}
exports.getWithdrawalMode = getWithdrawalMode;
function findOneCurrency(manager, symbol, walletId) {
    return __awaiter(this, void 0, void 0, function () {
        var currency, _a, _b, _c;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _b = (_a = manager).findOne;
                    _c = [entities_1.Currency];
                    _d = {
                        symbol: symbol,
                        walletId: walletId
                    };
                    return [4, getWithdrawalMode(manager, walletId)];
                case 1: return [4, _b.apply(_a, _c.concat([(_d.withdrawalMode = _e.sent(),
                            _d)]))];
                case 2:
                    currency = _e.sent();
                    if (!!currency) return [3, 4];
                    return [4, manager.findOne(entities_1.Currency, {
                            symbol: symbol,
                            walletId: walletId,
                            withdrawalMode: DEFAULT_WITHDRAWAL_MODE,
                        })];
                case 3:
                    currency = _e.sent();
                    _e.label = 4;
                case 4: return [2, currency];
            }
        });
    });
}
exports.findOneCurrency = findOneCurrency;
function findAnyRallyWallet(manager, walletId, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var withdrawalMode, wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getWithdrawalMode(manager, walletId)];
                case 1:
                    withdrawalMode = _a.sent();
                    return [4, manager.findOne(entities_1.RallyWallet, { walletId: walletId, currency: currency, withdrawalMode: withdrawalMode })];
                case 2:
                    wallet = _a.sent();
                    if (wallet) {
                        return [2, wallet];
                    }
                    return [4, manager.findOne(entities_1.RallyWallet, { walletId: walletId, currency: currency })];
                case 3:
                    wallet = _a.sent();
                    return [2, wallet];
            }
        });
    });
}
exports.findAnyRallyWallet = findAnyRallyWallet;
function findAnyColdWallet(manager, walletId, currency) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.ColdWallet, { walletId: walletId, currency: currency })];
                case 1:
                    wallet = _a.sent();
                    return [2, wallet];
            }
        });
    });
}
exports.findAnyColdWallet = findAnyColdWallet;
function findAnyInternalHotWallet(manager, walletId, currency) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, findAnyHotWallet(manager, walletId, currency, false)];
        });
    });
}
exports.findAnyInternalHotWallet = findAnyInternalHotWallet;
function findAnyExternalHotWallet(manager, walletId, currency) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, findAnyHotWallet(manager, walletId, currency, true)];
        });
    });
}
exports.findAnyExternalHotWallet = findAnyExternalHotWallet;
function getAllBusyHotWallets(manager, walletId) {
    return __awaiter(this, void 0, void 0, function () {
        var pendingStatuses, seedTransactions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pendingStatuses = [Enums_1.LocalTxStatus.SENT, Enums_1.LocalTxStatus.SIGNED, Enums_1.LocalTxStatus.SIGNING];
                    return [4, manager.find(entities_1.LocalTx, {
                            walletId: walletId,
                            type: typeorm_1.In([Enums_1.LocalTxType.SEED, Enums_1.LocalTxType.WITHDRAWAL_NORMAL, Enums_1.LocalTxType.WITHDRAWAL_COLD]),
                            status: typeorm_1.In(pendingStatuses),
                        })];
                case 1:
                    seedTransactions = _a.sent();
                    if (!seedTransactions.length) {
                        return [2, []];
                    }
                    return [2, seedTransactions.map(function (t) { return t.fromAddress; })];
            }
        });
    });
}
exports.getAllBusyHotWallets = getAllBusyHotWallets;
function getOneHotWallet(manager, currency, address) {
    return __awaiter(this, void 0, void 0, function () {
        var hotWallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.HotWallet, { currency: currency, address: address })];
                case 1:
                    hotWallet = _a.sent();
                    if (!hotWallet) {
                        throw new Error("Could not get hot wallet with specific information: currency=" + currency + ", address=" + address);
                    }
                    return [2, hotWallet];
            }
        });
    });
}
exports.getOneHotWallet = getOneHotWallet;
function checkHotWalletIsBusy(manager, hotWallet, pendingStatuses, platform) {
    return __awaiter(this, void 0, void 0, function () {
        var pendingTransactions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, Promise.all([
                        manager.find(entities_1.LocalTx, {
                            fromAddress: hotWallet.address,
                            currency: platform,
                            type: typeorm_1.In([Enums_1.LocalTxType.SEED, Enums_1.LocalTxType.WITHDRAWAL_NORMAL, Enums_1.LocalTxType.WITHDRAWAL_COLD]),
                            status: typeorm_1.In(pendingStatuses),
                        }),
                    ])];
                case 1:
                    pendingTransactions = (_a.sent())[0];
                    if (!pendingTransactions.length) {
                        return [2, false];
                    }
                    return [2, true];
            }
        });
    });
}
exports.checkHotWalletIsBusy = checkHotWalletIsBusy;
//# sourceMappingURL=findHotWallets.js.map