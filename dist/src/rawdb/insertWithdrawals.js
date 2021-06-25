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
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertWithdrawal = exports.insertWithdrawals = void 0;
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var _1 = require(".");
var sota_common_1 = require("sota-common");
function insertWithdrawals(manager, records, toAddress, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var withdrawals, tasks, pairs, amount;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!records.length) {
                        return [2, null];
                    }
                    withdrawals = new Array();
                    tasks = [];
                    pairs = new Map();
                    tasks.push.apply(tasks, records.map(function (record) { return __awaiter(_this, void 0, void 0, function () {
                        var withdrawal, withdrawalId;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    withdrawal = new entities_1.Withdrawal();
                                    withdrawal.currency = record.currency;
                                    withdrawal.fromAddress = record.toAddress;
                                    withdrawal.memo = "FROM_MACHINE";
                                    withdrawal.amount = record.amount;
                                    withdrawal.userId = userId;
                                    withdrawal.type = Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS;
                                    withdrawal.walletId = record.walletId;
                                    withdrawal.toAddress = toAddress;
                                    withdrawal.status = Enums_1.WithdrawalStatus.UNSIGNED;
                                    withdrawals.push(withdrawal);
                                    return [4, saveAndGetPair(manager, withdrawal)];
                                case 1:
                                    withdrawalId = _a.sent();
                                    pairs.set(record.id, withdrawalId);
                                    return [2];
                            }
                        });
                    }); }));
                    amount = records.reduce(function (memo, deposit) {
                        return memo.plus(new sota_common_1.BigNumber(deposit.amount));
                    }, new sota_common_1.BigNumber(0));
                    tasks.push(_1.handlePendingWithdrawalBalance(manager, amount.toString(), records[0].walletId, sota_common_1.CurrencyRegistry.getOneCurrency(records[0].currency)));
                    return [4, Promise.all(tasks)];
                case 1:
                    _a.sent();
                    return [2, pairs];
            }
        });
    });
}
exports.insertWithdrawals = insertWithdrawals;
function insertWithdrawal(manager, records, toAddress, userId, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var pairs, record, withdrawal, withdrawalId;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!records.length) {
                        return [2, null];
                    }
                    pairs = new Map();
                    record = records[0];
                    withdrawal = new entities_1.Withdrawal();
                    withdrawal.currency = record.currency;
                    withdrawal.fromAddress = record.toAddress;
                    withdrawal.memo = "FROM_MACHINE";
                    withdrawal.amount = amount.toFixed();
                    withdrawal.userId = userId;
                    withdrawal.type = Enums_1.WithdrawOutType.AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS;
                    withdrawal.walletId = record.walletId;
                    withdrawal.toAddress = toAddress;
                    withdrawal.status = Enums_1.WithdrawalStatus.UNSIGNED;
                    return [4, saveAndGetPair(manager, withdrawal)];
                case 1:
                    withdrawalId = _a.sent();
                    records.map(function (record) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            pairs.set(record.id, withdrawalId);
                            return [2];
                        });
                    }); });
                    return [4, _1.handlePendingWithdrawalBalance(manager, amount.toString(), records[0].walletId, sota_common_1.CurrencyRegistry.getOneCurrency(records[0].currency))];
                case 2:
                    _a.sent();
                    return [2, pairs];
            }
        });
    });
}
exports.insertWithdrawal = insertWithdrawal;
function saveAndGetPair(manager, withdrawal) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.Withdrawal).save(withdrawal)];
                case 1: return [2, (_a.sent()).id];
            }
        });
    });
}
//# sourceMappingURL=insertWithdrawals.js.map