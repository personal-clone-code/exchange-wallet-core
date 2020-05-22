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
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
function pickSomePendingMailJobs(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var nextJobs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.MailJob).find({
                        where: {
                            updatedAt: typeorm_1.LessThan(sota_common_1.Utils.now()),
                            isSent: false,
                            retryCount: typeorm_1.LessThan(6),
                        },
                        order: {
                            updatedAt: 'ASC',
                        },
                        take: 10,
                    })];
                case 1:
                    nextJobs = _a.sent();
                    return [2, nextJobs];
            }
        });
    });
}
exports.pickSomePendingMailJobs = pickSomePendingMailJobs;
function insertMailJob(manager, props) {
    return __awaiter(this, void 0, void 0, function () {
        var newJob, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    newJob = new entities_1.MailJob();
                    newJob.senderName = props.senderName;
                    newJob.senderAddress = props.senderAddress;
                    newJob.recipientAddress = props.recipientAddress;
                    newJob.title = props.title;
                    newJob.templateName = props.templateName;
                    newJob.content = JSON.stringify(props.content);
                    return [4, manager.save(newJob)];
                case 1:
                    result = _a.sent();
                    return [4, insertMailLogRecord(manager, {
                            jobId: result.id,
                            status: Enums_1.MailStatus.CREATED,
                        })];
                case 2:
                    _a.sent();
                    return [2, result];
            }
        });
    });
}
exports.insertMailJob = insertMailJob;
function increaseMailJobRetryCount(manager, jobId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager
                        .createQueryBuilder()
                        .update(entities_1.MailJob)
                        .set({
                        retryCount: function () { return "retry_count + 1"; },
                        updatedAt: function () { return sota_common_1.Utils.now() + 3 * 60 * 1000; },
                    })
                        .where({
                        id: jobId,
                    })
                        .execute()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.increaseMailJobRetryCount = increaseMailJobRetryCount;
function updateMailJobSent(manager, jobId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.update(entities_1.MailJob, { id: jobId }, { isSent: true })];
                case 1:
                    _a.sent();
                    return [4, insertMailLogRecord(manager, {
                            jobId: jobId,
                            status: Enums_1.MailStatus.SENT,
                            msg: 'OK',
                        })];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.updateMailJobSent = updateMailJobSent;
function insertMailLogRecord(manager, props) {
    return __awaiter(this, void 0, void 0, function () {
        var mailLog;
        return __generator(this, function (_a) {
            mailLog = new entities_1.MailLog();
            mailLog.jobId = props.jobId;
            mailLog.status = props.status;
            mailLog.msg = props.msg;
            return [2, manager.save(mailLog)];
        });
    });
}
exports.insertMailLogRecord = insertMailLogRecord;
//# sourceMappingURL=doExecuteMailService.js.map