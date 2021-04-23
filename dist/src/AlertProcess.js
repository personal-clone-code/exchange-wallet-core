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
exports.AlertProcess = void 0;
var sota_common_1 = require("sota-common");
var uuid_1 = require("uuid");
var typeorm_1 = require("typeorm");
var entities_1 = require("./entities");
var Enums_1 = require("./Enums");
var rawdb_1 = require("./rawdb");
var logger = sota_common_1.getLogger('AlertProcess');
var waitingTime = 6 * 60 * 60 * 1000;
var AlertProcess = (function (_super) {
    __extends(AlertProcess, _super);
    function AlertProcess() {
        var _this = _super.call(this) || this;
        _this._nextTickTimer = 10 * 60 * 1000;
        _this._id = uuid_1.v1();
        return _this;
    }
    AlertProcess.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2];
            });
        });
    };
    AlertProcess.prototype.doProcess = function () {
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
                                    logger.error("AlertProcess do process failed with error");
                                    logger.error(e_1);
                                    return [3, 3];
                                case 3: return [2];
                            }
                        });
                    }); })];
            });
        });
    };
    AlertProcess.prototype._doProcess = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pendingWithdrawals, pendingLocalTxs, pendingCollects, appName, sender, senderName, receiver, mailProps;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, Promise.all([
                            this._getAllPendingWithdrawals(manager),
                            this._getAllPendingLocalTxs(manager),
                            this._getAllUnCollectDeposits(manager),
                        ])];
                    case 1:
                        _a = _b.sent(), pendingWithdrawals = _a[0], pendingLocalTxs = _a[1], pendingCollects = _a[2];
                        if (!pendingWithdrawals.length && !pendingLocalTxs.length && !pendingCollects.length) {
                            logger.info("Dont have record pending too long");
                            return [2];
                        }
                        logger.info("There are some records pending too long, send mail to operators");
                        appName = process.env.APP_NAME || '【Bitcastle】';
                        sender = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_ADDRESS');
                        senderName = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_FROM_NAME');
                        receiver = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('MAIL_RECIPIENT_ERROR_ALERT');
                        if (!receiver || !sota_common_1.Utils.isValidEmail(receiver)) {
                            logger.error("Mailer could not send email to receiver=" + receiver + ". Please check it.");
                            return [2];
                        }
                        mailProps = {
                            senderName: senderName,
                            senderAddress: sender,
                            recipientAddress: receiver,
                            title: appName + " Some withdrawals, deposits, local transactions are pending too long",
                            templateName: 'alert_record_pending_too_long_layout.hbs',
                            content: {
                                recipient_email: receiver,
                                pending_withdrawals: pendingWithdrawals && pendingWithdrawals.length !== 0 ? pendingWithdrawals.join(', ') : 'Nothing',
                                pending_local_txs: pendingLocalTxs && pendingLocalTxs.length !== 0 ? pendingLocalTxs.join(', ') : 'Nothing',
                                pending_collects: pendingCollects && pendingCollects.length !== 0 ? pendingCollects.join(', ') : 'Nothing',
                            },
                        };
                        return [4, rawdb_1.insertMailJob(manager, mailProps)];
                    case 2:
                        _b.sent();
                        return [2];
                }
            });
        });
    };
    AlertProcess.prototype._getAllPendingLocalTxs = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var now, pendingLocalTxs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = sota_common_1.Utils.nowInMillis();
                        return [4, manager.getRepository(entities_1.LocalTx).find({
                                where: {
                                    status: typeorm_1.Not(typeorm_1.In([Enums_1.WithdrawalStatus.FAILED, Enums_1.WithdrawalStatus.COMPLETED])),
                                    createdAt: typeorm_1.LessThan(now - waitingTime),
                                },
                            })];
                    case 1:
                        pendingLocalTxs = _a.sent();
                        return [2, pendingLocalTxs.map(function (_record) { return _record.id; })];
                }
            });
        });
    };
    AlertProcess.prototype._getAllPendingWithdrawals = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var now, pendingWithdrawals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = sota_common_1.Utils.nowInMillis();
                        return [4, manager.getRepository(entities_1.Withdrawal).find({
                                where: {
                                    status: typeorm_1.Not(typeorm_1.In([Enums_1.WithdrawalStatus.FAILED, Enums_1.WithdrawalStatus.COMPLETED])),
                                    createAt: waitingTime ? typeorm_1.LessThan(now - waitingTime) : undefined,
                                },
                            })];
                    case 1:
                        pendingWithdrawals = _a.sent();
                        return [2, pendingWithdrawals.map(function (_record) { return _record.id; })];
                }
            });
        });
    };
    AlertProcess.prototype._getAllUnCollectDeposits = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var now, pendingCollect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = sota_common_1.Utils.nowInMillis();
                        return [4, manager.getRepository(entities_1.Deposit).find({
                                where: {
                                    collectStatus: typeorm_1.In([Enums_1.CollectStatus.UNCOLLECTED, Enums_1.CollectStatus.COLLECTING, Enums_1.CollectStatus.SEED_REQUESTED]),
                                    createAt: waitingTime ? typeorm_1.LessThan(now - waitingTime) : undefined,
                                },
                            })];
                    case 1:
                        pendingCollect = _a.sent();
                        return [2, pendingCollect.map(function (_record) { return _record.id; })];
                }
            });
        });
    };
    return AlertProcess;
}(sota_common_1.BaseIntervalWorker));
exports.AlertProcess = AlertProcess;
//# sourceMappingURL=AlertProcess.js.map