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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddressBalance = exports.processOneDepositTransaction = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var insertDeposit_1 = __importDefault(require("./insertDeposit"));
var entities_1 = require("../entities");
var rawdb = __importStar(require("../rawdb"));
var lodash_1 = __importDefault(require("lodash"));
var logger = sota_common_1.getLogger('processOneDepositTransaction');
function processOneDepositTransaction(manager, crawler, tx, watchingAddresses) {
    return __awaiter(this, void 0, void 0, function () {
        var outputs, requiredConfirmations, isTxConfirmed;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputs = tx.extractOutputEntries().filter(function (output) { return watchingAddresses.indexOf(output.address) > -1; });
                    if (!outputs.length) {
                        return [2];
                    }
                    requiredConfirmations = crawler.getRequiredConfirmations();
                    isTxConfirmed = tx.confirmations >= requiredConfirmations;
                    if (!isTxConfirmed) {
                        logger.info("Tx " + tx.txid + " doesn't have enough confirmations: " + tx.confirmations);
                        return [2];
                    }
                    return [4, isInternalTransfer(manager, tx)];
                case 1:
                    if (_a.sent()) {
                        logger.info("Tx " + tx.txid + " is a internal tx, will not write to deposit");
                        return [2];
                    }
                    return [4, updateAddressBalance(manager, tx)];
                case 2:
                    _a.sent();
                    return [4, sota_common_1.Utils.PromiseAll(outputs.map(function (output) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2, insertDeposit_1.default(manager, output, tx.extractSenderAddresses())];
                        }); }); }))];
                case 3:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.processOneDepositTransaction = processOneDepositTransaction;
function updateAddressBalance(manager, tx) {
    return __awaiter(this, void 0, void 0, function () {
        var redisClient, entries, addresses;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redisClient = sota_common_1.getRedisClient();
                    entries = tx.extractEntries();
                    return [4, rawdb.findAddresses(manager, entries.map(function (e) { return e.address; }))];
                case 1:
                    addresses = _a.sent();
                    logger.info("push event redis: EVENT_ADDRESS_BALANCE_CHANGED");
                    return [4, sota_common_1.Utils.PromiseAll(addresses.map(function (address) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                redisClient.publish(sota_common_1.EnvConfigRegistry.getAppId(), JSON.stringify({
                                    event: 'EVENT_ADDRESS_BALANCE_CHANGED',
                                    data: {
                                        walletId: address.walletId,
                                        currency: lodash_1.default.find(entries, function (e) { return e.address === address.address; }).currency.symbol,
                                        address: address.address,
                                    },
                                }));
                                return [2];
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.updateAddressBalance = updateAddressBalance;
function isInternalTransfer(manager, tx) {
    return __awaiter(this, void 0, void 0, function () {
        var internalTx, senderAddresses, addressRecord, hotAddressRecord;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.LocalTx).findOne({ txid: tx.txid })];
                case 1:
                    internalTx = _a.sent();
                    if (internalTx) {
                        return [2, true];
                    }
                    senderAddresses = tx.extractSenderAddresses();
                    if (!senderAddresses.length) {
                        return [2, false];
                    }
                    return [4, manager.getRepository(entities_1.Address).findOne({ address: typeorm_1.In(senderAddresses) })];
                case 2:
                    addressRecord = _a.sent();
                    if (addressRecord) {
                        logger.warn("Tx " + tx.txid + " is sent from an internal address sender=" + senderAddresses + " wallet_id=" + addressRecord.walletId);
                        if (!addressRecord.isExternal && addressRecord.secret !== '') {
                            logger.error("Tx " + tx.txid + " is sent from an internal address, but it's not in internal transfer table.");
                            return [2, true];
                        }
                    }
                    return [4, manager.getRepository(entities_1.HotWallet).findOne({ address: typeorm_1.In(senderAddresses) })];
                case 3:
                    hotAddressRecord = _a.sent();
                    if (hotAddressRecord) {
                        logger.error("Tx " + tx.txid + " is sent from an internal hotwallet, but it's not in internal transfer table.");
                        return [2, true];
                    }
                    return [2, false];
            }
        });
    });
}
exports.default = processOneDepositTransaction;
//# sourceMappingURL=processOneDepositTransaction.js.map