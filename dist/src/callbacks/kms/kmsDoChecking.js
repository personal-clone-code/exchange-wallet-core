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
exports.encryptPrivateKey = exports.checkAddress = exports.checkExistKms = exports._getUnEncryptedAddresses = exports._getAllUnEncryptedHotWallets = exports.getKmsDataKey = exports._fixPrivateKeyIsUnencrypted = exports._checkPrivateKeyIsUnencrypted = exports.fixPrivateKeyIsUnencrypted = exports.checkPrivateKeyIsUnencrypted = void 0;
var _ = __importStar(require("lodash"));
var typeorm_1 = require("typeorm");
var entities_1 = require("../../entities");
var sota_common_1 = require("sota-common");
var Kms_1 = require("../../encrypt/Kms");
var rawdb = __importStar(require("../../rawdb"));
var logger = sota_common_1.getLogger('KmsChecking');
var limitRecord = 500;
function checkPrivateKeyIsUnencrypted() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _checkPrivateKeyIsUnencrypted(manager)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2];
            }
        });
    });
}
exports.checkPrivateKeyIsUnencrypted = checkPrivateKeyIsUnencrypted;
function fixPrivateKeyIsUnencrypted() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _fixPrivateKeyIsUnencrypted(manager)];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2];
            }
        });
    });
}
exports.fixPrivateKeyIsUnencrypted = fixPrivateKeyIsUnencrypted;
function _checkPrivateKeyIsUnencrypted(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var key, unEncryptedAddresses, totalAddress, totalTask, round, _i, round_1, r, addresses, hotWalletAddresses, allCurrencies, allNativeCurrencies, _a, allNativeCurrencies_1, currency, subAddresses;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, getKmsDataKey(manager)];
                case 1:
                    key = _b.sent();
                    if (!key) {
                        logger.info("There's no CMK in database...");
                        return [2];
                    }
                    unEncryptedAddresses = [];
                    return [4, manager.getRepository(entities_1.Address).count()];
                case 2:
                    totalAddress = _b.sent();
                    totalTask = Math.ceil(totalAddress / limitRecord);
                    round = Array.from(Array(totalTask).keys());
                    _i = 0, round_1 = round;
                    _b.label = 3;
                case 3:
                    if (!(_i < round_1.length)) return [3, 6];
                    r = round_1[_i];
                    return [4, _getUnEncryptedAddresses(manager, r * limitRecord)];
                case 4:
                    addresses = _b.sent();
                    unEncryptedAddresses = _.concat(unEncryptedAddresses, addresses.map(function (address) { return address.address; }));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3, 3];
                case 6:
                    logger.info("# Un-encrypted address:");
                    logger.info("# ====================================");
                    logger.info("# List addresses that have unencrypted private key are reported below:");
                    unEncryptedAddresses.map(function (address) { return logger.info(address); });
                    return [4, _getAllUnEncryptedHotWallets(manager)];
                case 7:
                    hotWalletAddresses = _b.sent();
                    logger.info("# Un-encrypted hot wallet address:");
                    logger.info("# ====================================");
                    logger.info("# List hot wallet addresses that have unencrypted private key are reported below:");
                    hotWalletAddresses.forEach(function (address) { return logger.info(address.address); });
                    logger.info("# Un-encrypted sub tables address:");
                    logger.info("# ====================================");
                    allCurrencies = sota_common_1.CurrencyRegistry.getAllCurrencies();
                    allNativeCurrencies = _.filter(allCurrencies, function (currency) { return !!currency.isNative; });
                    _a = 0, allNativeCurrencies_1 = allNativeCurrencies;
                    _b.label = 8;
                case 8:
                    if (!(_a < allNativeCurrencies_1.length)) return [3, 11];
                    currency = allNativeCurrencies_1[_a];
                    return [4, _getUnEncryptedAddressesFromSubTable(manager, currency.symbol)];
                case 9:
                    subAddresses = _b.sent();
                    if (subAddresses && subAddresses.length !== 0) {
                        logger.info("# List addresses in " + currency.symbol + "_address that have unencrypted private key are reported below:");
                        subAddresses.forEach(function (address) { return logger.info(address.address); });
                    }
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3, 8];
                case 11:
                    logger.info("# ====================================");
                    logger.info("# Finished!");
                    return [2];
            }
        });
    });
}
exports._checkPrivateKeyIsUnencrypted = _checkPrivateKeyIsUnencrypted;
function _getUnEncryptedAddressesFromSubTable(manager, symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var existedTable, e_1, unEncryptedAddresses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, manager.query("select * from information_schema.tables where table_schema = ? and table_name = ?", [process.env.TYPEORM_DATABASE, symbol.toLowerCase() + "_address"])];
                case 1:
                    existedTable = _a.sent();
                    if (!existedTable || existedTable.length === 0) {
                        logger.debug(symbol + "_address seems not exitsed.");
                        return [2, []];
                    }
                    return [3, 3];
                case 2:
                    e_1 = _a.sent();
                    logger.debug(symbol + "_address seems not exitsed.");
                    return [2, []];
                case 3: return [4, manager
                        .createQueryBuilder()
                        .select('*')
                        .from(symbol + "_address", "address")
                        .where("kms_data_key_id = 0")
                        .execute()];
                case 4:
                    unEncryptedAddresses = _a.sent();
                    return [2, _.map(unEncryptedAddresses, function (address) {
                            return {
                                address: address.address,
                                privateKey: address.private_key,
                            };
                        })];
            }
        });
    });
}
function _fixPrivateKeyIsUnencrypted(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var key, totalAddress, totalTask, round, _i, round_2, r, addresses, addressTasks, addressResults, hotWalletAddresses, hotWalletTasks, hotWalletResults, allCurrencies, allNativeCurrencies, _loop_1, _a, allNativeCurrencies_2, currency;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, getKmsDataKey(manager)];
                case 1:
                    key = _b.sent();
                    if (!key) {
                        logger.info("There's no CMK in database...");
                        return [2];
                    }
                    return [4, manager.getRepository(entities_1.Address).count()];
                case 2:
                    totalAddress = _b.sent();
                    totalTask = Math.ceil(totalAddress / limitRecord);
                    round = Array.from(Array(totalTask).keys());
                    _i = 0, round_2 = round;
                    _b.label = 3;
                case 3:
                    if (!(_i < round_2.length)) return [3, 8];
                    r = round_2[_i];
                    return [4, _getUnEncryptedAddresses(manager, r * limitRecord)];
                case 4:
                    addresses = _b.sent();
                    addressTasks = _.map(addresses, function (address) { return __awaiter(_this, void 0, void 0, function () {
                        var privateKey, _a, e_2;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    privateKey = JSON.parse(address.secret);
                                    if (privateKey.private_key) {
                                        privateKey = privateKey.private_key;
                                    }
                                    if (!(privateKey && privateKey.length !== 0)) return [3, 2];
                                    _a = address;
                                    return [4, encryptPrivateKey(privateKey, key)];
                                case 1:
                                    _a.secret = _b.sent();
                                    _b.label = 2;
                                case 2: return [2, address];
                                case 3:
                                    e_2 = _b.sent();
                                    return [2, null];
                                case 4: return [2];
                            }
                        });
                    }); });
                    return [4, Promise.all(addressTasks)];
                case 5:
                    addressResults = _b.sent();
                    addressResults = _.compact(addressResults);
                    return [4, rawdb.updateAddresses(manager, addressResults)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    _i++;
                    return [3, 3];
                case 8: return [4, _getAllUnEncryptedHotWallets(manager)];
                case 9:
                    hotWalletAddresses = _b.sent();
                    hotWalletTasks = _.map(hotWalletAddresses, function (address) { return __awaiter(_this, void 0, void 0, function () {
                        var privateKey, _a, e_3;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    privateKey = JSON.parse(address.secret);
                                    if (privateKey.private_key) {
                                        privateKey = privateKey.private_key;
                                    }
                                    if (!(privateKey && privateKey.length !== 0)) return [3, 2];
                                    _a = address;
                                    return [4, encryptPrivateKey(privateKey, key)];
                                case 1:
                                    _a.secret = _b.sent();
                                    _b.label = 2;
                                case 2: return [2, address];
                                case 3:
                                    e_3 = _b.sent();
                                    return [2, null];
                                case 4: return [2];
                            }
                        });
                    }); });
                    return [4, Promise.all(hotWalletTasks)];
                case 10:
                    hotWalletResults = _b.sent();
                    hotWalletResults = _.compact(hotWalletAddresses);
                    return [4, rawdb.updateAllHotWalletAddresses(manager, hotWalletResults)];
                case 11:
                    _b.sent();
                    allCurrencies = sota_common_1.CurrencyRegistry.getAllCurrencies();
                    allNativeCurrencies = _.filter(allCurrencies, function (currency) { return !!currency.isNative; });
                    _loop_1 = function (currency) {
                        var subAddresses, tasks;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _getUnEncryptedAddressesFromSubTable(manager, currency.symbol)];
                                case 1:
                                    subAddresses = _a.sent();
                                    if (!(subAddresses && subAddresses.length !== 0)) return [3, 3];
                                    tasks = _.map(subAddresses, function (address) { return __awaiter(_this, void 0, void 0, function () {
                                        var secret;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4, Kms_1.Kms.getInstance().encrypt(address.privateKey, key.id)];
                                                case 1:
                                                    secret = _a.sent();
                                                    return [4, _updatePrivateKeyInSubtable(manager, currency.symbol.toLowerCase() + "_address", address.address, secret, key.id)];
                                                case 2:
                                                    _a.sent();
                                                    return [2];
                                            }
                                        });
                                    }); });
                                    return [4, Promise.all(tasks)];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2];
                            }
                        });
                    };
                    _a = 0, allNativeCurrencies_2 = allNativeCurrencies;
                    _b.label = 12;
                case 12:
                    if (!(_a < allNativeCurrencies_2.length)) return [3, 15];
                    currency = allNativeCurrencies_2[_a];
                    return [5, _loop_1(currency)];
                case 13:
                    _b.sent();
                    _b.label = 14;
                case 14:
                    _a++;
                    return [3, 12];
                case 15:
                    logger.info("All addresses have encrypted their private key");
                    return [2];
            }
        });
    });
}
exports._fixPrivateKeyIsUnencrypted = _fixPrivateKeyIsUnencrypted;
function _updatePrivateKeyInSubtable(manager, table, address, privateKey, kmsDataKeyId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.query("update " + table + " set private_key = ?, kms_data_key_id = ? where address = ?", [
                        privateKey,
                        kmsDataKeyId,
                        address,
                    ])];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function getKmsDataKey(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var cmks, cmk, dataKeys, key, rawDataKey, dataKeyRecord, dataKey;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, checkExistKms(manager)];
                case 1:
                    cmks = _a.sent();
                    if (!cmks.length) {
                        return [2, null];
                    }
                    cmk = cmks[0];
                    return [4, manager.getRepository(entities_1.KmsDataKey).find({ cmkId: cmk.id })];
                case 2:
                    dataKeys = _a.sent();
                    if (!!dataKeys.length) return [3, 5];
                    logger.info("There're no data key. Will create a new one...");
                    return [4, Kms_1.Kms.getInstance().generateDataKey(cmk.id)];
                case 3:
                    rawDataKey = _a.sent();
                    dataKeyRecord = new entities_1.KmsDataKey();
                    dataKeyRecord.cmkId = cmk.id;
                    dataKeyRecord.encryptedDataKey = rawDataKey.cipher;
                    dataKeyRecord.isEnabled = 1;
                    return [4, manager.getRepository(entities_1.KmsDataKey).save(dataKeyRecord)];
                case 4:
                    dataKey = _a.sent();
                    logger.info("Created data key: " + dataKey.encryptedDataKey + " (id:" + dataKey.id + ")");
                    key = dataKey;
                    return [3, 6];
                case 5:
                    key = dataKeys[0];
                    _a.label = 6;
                case 6: return [2, key];
            }
        });
    });
}
exports.getKmsDataKey = getKmsDataKey;
function _getAllUnEncryptedHotWallets(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, unencryptedAddresses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, rawdb.getAllHotWalletAddress(manager)];
                case 1:
                    addresses = _a.sent();
                    unencryptedAddresses = _.filter(addresses, function (address) { return !checkAddress(address.secret); });
                    return [2, unencryptedAddresses];
            }
        });
    });
}
exports._getAllUnEncryptedHotWallets = _getAllUnEncryptedHotWallets;
function _getUnEncryptedAddresses(manager, offset) {
    return __awaiter(this, void 0, void 0, function () {
        var addresses, unencryptedAddresses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.Address).find({
                        take: limitRecord,
                        skip: offset,
                    })];
                case 1:
                    addresses = _a.sent();
                    unencryptedAddresses = _.filter(addresses, function (address) { return !checkAddress(address.secret); });
                    return [2, unencryptedAddresses];
            }
        });
    });
}
exports._getUnEncryptedAddresses = _getUnEncryptedAddresses;
function checkExistKms(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var cmks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, manager.getRepository(entities_1.KmsCmk).find({})];
                case 1:
                    cmks = _a.sent();
                    return [2, cmks];
            }
        });
    });
}
exports.checkExistKms = checkExistKms;
function checkAddress(privateKey) {
    try {
        var secret = JSON.parse(privateKey);
        if (secret.private_key) {
            if (parseInt(secret.kms_data_key_id, 10) > 0) {
                return true;
            }
        }
        else if (secret.spending_password) {
            if (parseInt(secret.kms_data_key_id, 10) > 0) {
                return true;
            }
        }
        return false;
    }
    catch (e) {
        return false;
    }
}
exports.checkAddress = checkAddress;
function encryptPrivateKey(privateKey, dataKey) {
    return __awaiter(this, void 0, void 0, function () {
        var kms_data_key_id, private_key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    kms_data_key_id = dataKey.id;
                    return [4, Kms_1.Kms.getInstance().encrypt(privateKey, kms_data_key_id)];
                case 1:
                    private_key = _a.sent();
                    return [2, JSON.stringify({
                            private_key: private_key,
                            kms_data_key_id: kms_data_key_id,
                        })];
            }
        });
    });
}
exports.encryptPrivateKey = encryptPrivateKey;
//# sourceMappingURL=kmsDoChecking.js.map