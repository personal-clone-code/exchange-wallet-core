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
Object.defineProperty(exports, "__esModule", { value: true });
var sota_common_1 = require("sota-common");
var entities_1 = require("../entities");
var insertDepositLog_1 = require("./insertDepositLog");
var _1 = require(".");
function updateDepositCollectStatus(manager, transaction, status, event, type) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, whereColId, records, tasks;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    whereColId = type === 'seed' ? 'seedLocalTxId' : 'collectLocalTxId';
                    return [4, manager.find(entities_1.Deposit, (_a = {},
                            _a[whereColId] = transaction.id,
                            _a))];
                case 1:
                    records = _c.sent();
                    tasks = [];
                    records.map(function (record) {
                        tasks.push(insertDepositLog_1.insertDepositLog(manager, record.id, event, transaction.id));
                    });
                    tasks.push(manager.update(entities_1.Deposit, (_b = {}, _b[whereColId] = transaction.id, _b), { collectStatus: status, collectedTimestamp: transaction.updatedAt }));
                    return [4, sota_common_1.Utils.PromiseAll(tasks)];
                case 2:
                    _c.sent();
                    return [2];
            }
        });
    });
}
function updateDepositCollectStatusBySeedTxId(manager, transaction, status, event) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, updateDepositCollectStatus(manager, transaction, status, event, 'seed')];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.updateDepositCollectStatusBySeedTxId = updateDepositCollectStatusBySeedTxId;
function updateDepositCollectStatusByCollectTxId(manager, transaction, status, event) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, updateDepositCollectStatus(manager, transaction, status, event, 'collect')];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.updateDepositCollectStatusByCollectTxId = updateDepositCollectStatusByCollectTxId;
function updateDepositCollectStatusByWithdrawalTxId(manager, transaction, withdrawal_id, status, event) {
    return __awaiter(this, void 0, void 0, function () {
        var records, tasks, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.Deposit).find({
                        where: {
                            collectWithdrawalId: withdrawal_id,
                        },
                    })];
                case 1:
                    records = _a.sent();
                    tasks = [];
                    records.map(function (record) {
                        tasks.push(insertDepositLog_1.insertDepositLog(manager, record.id, event, transaction.id));
                    });
                    tasks.push(manager.update(entities_1.Deposit, { collectWithdrawalId: withdrawal_id }, {
                        collectStatus: status,
                        collectedTimestamp: transaction.updatedAt,
                        collectLocalTxId: transaction.id,
                        collectedTxid: transaction.txid,
                    }));
                    return [4, sota_common_1.GatewayRegistry.getGatewayInstance(transaction.currency).getOneTransaction(transaction.txid)];
                case 2:
                    tx = _a.sent();
                    tasks.push(_1.updateAddressBalance(manager, tx));
                    return [4, sota_common_1.Utils.PromiseAll(tasks)];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.updateDepositCollectStatusByWithdrawalTxId = updateDepositCollectStatusByWithdrawalTxId;
//# sourceMappingURL=updateDepositCollectStatus.js.map