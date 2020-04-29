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
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
var _1 = require(".");
var limit = 500;
var logger = sota_common_1.getLogger('DBTools::# Crawler::');
function doCheckCrawler() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _doCheckCrawler(manager)];
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
exports.doCheckCrawler = doCheckCrawler;
function _doCheckCrawler(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var crawlerErrors, totalUncompletedDeposits, totalRound, round, _i, round_1, r, unCompletedDeposits;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    logger.info("Start checking...");
                    crawlerErrors = [];
                    return [4, manager
                            .getRepository(entities_1.Deposit)
                            .createQueryBuilder()
                            .where("collect_status NOT IN ('" + Enums_1.CollectStatus.COLLECTED + "', '" + Enums_1.CollectStatus.NOTCOLLECT + "')")
                            .andWhere("collected_txid NOT IN ('NO_COLLECT_DUST_AMOUNT')")
                            .andWhere("updated_at < " + (sota_common_1.Utils.nowInMillis() - 30 * 60 * 60))
                            .getCount()];
                case 1:
                    totalUncompletedDeposits = _a.sent();
                    totalRound = Math.ceil(totalUncompletedDeposits / limit);
                    round = Array.from(Array(totalRound).keys());
                    _i = 0, round_1 = round;
                    _a.label = 2;
                case 2:
                    if (!(_i < round_1.length)) return [3, 5];
                    r = round_1[_i];
                    return [4, manager
                            .getRepository(entities_1.Deposit)
                            .createQueryBuilder()
                            .where("collect_status NOT IN ('" + Enums_1.CollectStatus.COLLECTED + "', '" + Enums_1.CollectStatus.NOTCOLLECT + "')")
                            .andWhere("collected_txid NOT IN ('NO_COLLECT_DUST_AMOUNT')")
                            .andWhere("updated_at < " + (sota_common_1.Utils.nowInMillis() - 30 * 60 * 60))
                            .orderBy("updated_at", 'ASC')
                            .take(limit)
                            .skip(r * limit)
                            .execute()];
                case 3:
                    unCompletedDeposits = _a.sent();
                    if (!unCompletedDeposits || unCompletedDeposits.length === 0) {
                        logger.warn("There're no uncompleted deposits. So, skip round " + r + ".");
                        return [2];
                    }
                    unCompletedDeposits.map(function (deposit) {
                        var seconds = Math.floor((sota_common_1.Utils.nowInMillis() - deposit.Deposit_updated_at) / 1000);
                        var overtime = _1.getOverTime(seconds);
                        crawlerErrors.push("Deposit id " + deposit.Deposit_id + " in '" + deposit.Deposit_collect_status + "' over " + overtime + ".");
                    });
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3, 2];
                case 5:
                    logger.info("" + JSON.stringify({
                        isOK: crawlerErrors.length === 0,
                        totalErrors: crawlerErrors.length,
                        details: crawlerErrors,
                    }));
                    logger.info("Finished!");
                    logger.info("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=doCheckCrawler.js.map