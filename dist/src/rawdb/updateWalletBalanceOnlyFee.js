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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWalletBalanceOnlyFee = void 0;
var Enums_1 = require("../Enums");
var entities_1 = require("../entities");
var rawdb = __importStar(require("./index"));
var sota_common_1 = require("sota-common");
function updateWalletBalanceOnlyFee(manager, transfer, status, fee, typeFee) {
    return __awaiter(this, void 0, void 0, function () {
        var balanceChange, walletBalance, withdrawalFeeLog, currency, feeCurrency;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.findOne(entities_1.WalletBalance, {
                        walletId: transfer.walletId,
                    })];
                case 1:
                    walletBalance = _a.sent();
                    if (!walletBalance) {
                        throw new Error("walletBalance id=" + transfer.walletId + " is not existed");
                    }
                    if (status === Enums_1.CollectStatus.UNCOLLECTED) {
                        balanceChange = '0';
                    }
                    if (status === Enums_1.CollectStatus.COLLECTED) {
                        balanceChange = '-' + fee.toString();
                    }
                    withdrawalFeeLog = new entities_1.WalletLog();
                    withdrawalFeeLog.walletId = transfer.walletId;
                    withdrawalFeeLog.currency = transfer.currency;
                    withdrawalFeeLog.refCurrency = transfer.currency;
                    withdrawalFeeLog.balanceChange = balanceChange;
                    withdrawalFeeLog.event = typeFee;
                    withdrawalFeeLog.refId = transfer.id;
                    currency = sota_common_1.CurrencyRegistry.getOneCurrency(transfer.currency);
                    feeCurrency = currency.platform;
                    return [4, sota_common_1.Utils.PromiseAll([
                            manager
                                .createQueryBuilder()
                                .update(entities_1.WalletBalance)
                                .set({
                                balance: function () {
                                    return status === Enums_1.CollectStatus.COLLECTED ? "balance - " + fee.toFixed(currency.nativeScale) : "balance";
                                },
                                updatedAt: sota_common_1.Utils.nowInMillis(),
                            })
                                .where({
                                walletId: transfer.walletId,
                                currency: feeCurrency,
                            })
                                .execute(),
                            rawdb.insertWalletLog(manager, withdrawalFeeLog),
                        ])];
                case 2:
                    _a.sent();
                    return [2, null];
            }
        });
    });
}
exports.updateWalletBalanceOnlyFee = updateWalletBalanceOnlyFee;
//# sourceMappingURL=updateWalletBalanceOnlyFee.js.map