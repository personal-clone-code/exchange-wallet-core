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
exports.seedRecordToAddressIsExist = exports.hasAnySeedRequestedToAddress = void 0;
var typeorm_1 = require("typeorm");
var entities_1 = require("../entities");
var Enums_1 = require("../Enums");
function hasAnySeedRequestedToAddress(manager, address) {
    return __awaiter(this, void 0, void 0, function () {
        var pendingSeedRecord, seedRequestedRecord;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.LocalTx).findOne({
                        where: {
                            toAddress: address,
                            type: Enums_1.LocalTxType.SEED,
                            status: typeorm_1.In([Enums_1.LocalTxStatus.SIGNING, Enums_1.LocalTxStatus.SIGNED, Enums_1.LocalTxStatus.SENT]),
                        },
                    })];
                case 1:
                    pendingSeedRecord = _a.sent();
                    if (pendingSeedRecord) {
                        return [2, true];
                    }
                    return [4, manager.getRepository(entities_1.Deposit).findOne({
                            where: {
                                toAddress: address,
                                collectStatus: typeorm_1.In([Enums_1.CollectStatus.SEED_REQUESTED]),
                            },
                        })];
                case 2:
                    seedRequestedRecord = _a.sent();
                    if (seedRequestedRecord) {
                        return [2, true];
                    }
                    return [2, false];
            }
        });
    });
}
exports.hasAnySeedRequestedToAddress = hasAnySeedRequestedToAddress;
function seedRecordToAddressIsExist(manager, address) {
    return __awaiter(this, void 0, void 0, function () {
        var seedTxRecord, seedRequestRecord;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.LocalTx).findOne({
                        where: {
                            toAddress: address,
                            type: Enums_1.LocalTxType.SEED,
                            status: typeorm_1.In([Enums_1.LocalTxStatus.SIGNING, Enums_1.LocalTxStatus.SIGNED, Enums_1.LocalTxStatus.SENT, Enums_1.LocalTxStatus.COMPLETED]),
                        },
                    })];
                case 1:
                    seedTxRecord = _a.sent();
                    if (seedTxRecord) {
                        return [2, true];
                    }
                    return [4, manager.getRepository(entities_1.Deposit).findOne({
                            where: {
                                toAddress: address,
                                collectStatus: typeorm_1.In([Enums_1.CollectStatus.SEEDING, Enums_1.CollectStatus.SEED_SIGNED, Enums_1.CollectStatus.SEED_SENT,]),
                            },
                        })];
                case 2:
                    seedRequestRecord = _a.sent();
                    if (seedRequestRecord) {
                        return [2, true];
                    }
                    return [2, false];
            }
        });
    });
}
exports.seedRecordToAddressIsExist = seedRecordToAddressIsExist;
//# sourceMappingURL=hasAnySeedRequestedToAddress.js.map