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
exports.updateWalletBalanceAfterDeposit = void 0;
var sota_common_1 = require("sota-common");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var rawdb = __importStar(require("."));
var logger = sota_common_1.getLogger('rawdb::updateWalletBalanceAfterDeposit');
function updateWalletBalanceAfterDeposit(manager, depositId, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var deposit, address, wallet, currency, currencyInfo, walletBalance, walletLog, hotWallet, hotWallet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.Deposit).findOneOrFail({ id: depositId })];
                case 1:
                    deposit = _a.sent();
                    return [4, manager.getRepository(entities_1.Address).findOneOrFail({ address: deposit.toAddress })];
                case 2:
                    address = _a.sent();
                    if (address.isExternal) {
                        logger.info("External Address " + address.address + " do not need to update walletBalance");
                        return [2];
                    }
                    return [4, manager.getRepository(entities_1.Wallet).findOneOrFail(address.walletId)];
                case 3:
                    wallet = _a.sent();
                    currency = deposit.currency;
                    currencyInfo = sota_common_1.CurrencyRegistry.getOneCurrency(currency);
                    return [4, manager.getRepository(entities_1.WalletBalance).findOne({ walletId: wallet.id, currency: currency })];
                case 4:
                    walletBalance = _a.sent();
                    if (!walletBalance) {
                        throw new Error("Wallet balance doesn't exist: walletId=" + wallet.id + " currency=" + currency);
                    }
                    walletLog = new entities_1.WalletLog();
                    walletLog.walletId = wallet.id;
                    walletLog.currency = currency;
                    walletLog.refCurrency = currency;
                    walletLog.event = Enums_1.WalletEvent.DEPOSIT;
                    walletLog.balanceChange = amount.toFixed(currencyInfo.nativeScale);
                    walletLog.refId = deposit.id;
                    return [4, sota_common_1.Utils.PromiseAll([
                            rawdb.increaseWalletBalance(manager, wallet.id, currency, amount),
                            rawdb.insertWalletLog(manager, walletLog),
                        ])];
                case 5:
                    _a.sent();
                    if (!(currency === sota_common_1.BlockchainPlatform.Cardano)) return [3, 8];
                    return [4, rawdb.findAnyHotWallet(manager, wallet.id, currencyInfo.platform, false)];
                case 6:
                    hotWallet = _a.sent();
                    return [4, rawdb.upperThresholdHandle(manager, currencyInfo, hotWallet)];
                case 7:
                    _a.sent();
                    return [3, 11];
                case 8: return [4, rawdb.findHotWalletByAddress(manager, deposit.toAddress)];
                case 9:
                    hotWallet = _a.sent();
                    if (!hotWallet) return [3, 11];
                    return [4, rawdb.upperThresholdHandle(manager, currencyInfo, hotWallet)];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [2];
            }
        });
    });
}
exports.updateWalletBalanceAfterDeposit = updateWalletBalanceAfterDeposit;
//# sourceMappingURL=updateWalletBalanceAfterDeposit.js.map