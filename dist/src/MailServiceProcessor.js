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
exports.MailServiceProcessor = void 0;
var _ = __importStar(require("lodash"));
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var rawdb = __importStar(require("./rawdb"));
var renderTemplate_1 = require("./mailer/renderTemplate");
var rawdb_1 = require("./rawdb");
var Enums_1 = require("./Enums");
var logger = sota_common_1.getLogger('MailServiceProcessor');
var MailServiceProcessor = (function (_super) {
    __extends(MailServiceProcessor, _super);
    function MailServiceProcessor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._nextTickTimer = 10000;
        return _this;
    }
    MailServiceProcessor.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2];
            });
        });
    };
    MailServiceProcessor.prototype.doProcess = function () {
        var _this = this;
        return typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
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
                        logger.error("MailServiceProcessor do process failed with error");
                        logger.error(e_1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    };
    MailServiceProcessor.prototype._doProcess = function (manager) {
        return __awaiter(this, void 0, void 0, function () {
            var allPendingJobs, tasks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, rawdb.pickSomePendingMailJobs(manager)];
                    case 1:
                        allPendingJobs = _a.sent();
                        if (!allPendingJobs || allPendingJobs.length === 0) {
                            logger.info("There are not mail job to be sent. Wait for next tick...");
                            return [2];
                        }
                        tasks = _.map(allPendingJobs, function (job) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4, this._processOneRecord(manager, job)];
                                    case 1:
                                        _a.sent();
                                        return [2];
                                }
                            });
                        }); });
                        return [4, Promise.all(tasks)];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    MailServiceProcessor.prototype._processOneRecord = function (manager, job) {
        return __awaiter(this, void 0, void 0, function () {
            var mailContent, mailer, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 7]);
                        mailContent = renderTemplate_1.renderTemplate(job.templateName, JSON.parse(job.content));
                        mailer = sota_common_1.Mailer.getInstance();
                        return [4, mailer.sendMail({
                                from: "\"" + job.senderName + "\" <" + job.senderAddress + ">",
                                to: job.recipientAddress,
                                subject: job.title,
                                content: mailContent,
                            })];
                    case 1:
                        _a.sent();
                        return [4, rawdb_1.updateMailJobSent(manager, job.id)];
                    case 2:
                        _a.sent();
                        return [3, 7];
                    case 3:
                        err_1 = _a.sent();
                        logger.error("Could not sent mail with error");
                        logger.error(err_1);
                        return [4, rawdb_1.increaseMailJobRetryCount(manager, job.id)];
                    case 4:
                        _a.sent();
                        if (!(job.retryCount === 5)) return [3, 6];
                        return [4, rawdb_1.insertMailLogRecord(manager, {
                                jobId: job.id,
                                status: Enums_1.MailStatus.FAILED,
                                msg: JSON.stringify(err_1.toString()),
                            })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3, 7];
                    case 7: return [2];
                }
            });
        });
    };
    return MailServiceProcessor;
}(sota_common_1.BaseIntervalWorker));
exports.MailServiceProcessor = MailServiceProcessor;
//# sourceMappingURL=MailServiceProcessor.js.map