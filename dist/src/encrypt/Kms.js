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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var crypto_1 = __importDefault(require("crypto"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var typeorm_1 = require("typeorm");
var instance;
var LOCAL_CACHED_RECORDS = new Map();
var ENCRYPT_ALGORITHM = 'aes256';
var Kms = (function () {
    function Kms() {
        aws_sdk_1.default.CredentialProviderChain.defaultProviders = [
            function sharedIniFileCredentials() {
                return new aws_sdk_1.default.SharedIniFileCredentials({
                    profile: process.env.AWS_PROFILE_NAME || 'default',
                });
            },
            function eC2MetadataCredentials() {
                return new aws_sdk_1.default.EC2MetadataCredentials();
            },
        ];
        aws_sdk_1.default.config.setPromisesDependency(Promise);
        this.connection = typeorm_1.getConnection();
    }
    Kms.getInstance = function () {
        if (!instance) {
            instance = new Kms();
        }
        return instance;
    };
    Kms.prototype.getMasterKey = function (cmkId) {
        return __awaiter(this, void 0, void 0, function () {
            var kms, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getKMSInstanceByKeyId(cmkId)];
                    case 1:
                        kms = _a.sent();
                        return [4, kms.describeKey({ KeyId: cmkId }).promise()];
                    case 2:
                        result = _a.sent();
                        return [2, result];
                }
            });
        });
    };
    Kms.prototype.generateDataKey = function (cmkId) {
        return __awaiter(this, void 0, void 0, function () {
            var kms, _a, Plaintext, CiphertextBlob;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!cmkId) {
                            throw new Error("Cannot generate data key with invalid cmk id: " + cmkId);
                        }
                        return [4, this.getKMSInstanceByKeyId(cmkId)];
                    case 1:
                        kms = _b.sent();
                        return [4, kms.generateDataKey({ KeyId: cmkId, KeySpec: 'AES_256' }).promise()];
                    case 2:
                        _a = _b.sent(), Plaintext = _a.Plaintext, CiphertextBlob = _a.CiphertextBlob;
                        return [2, {
                                plain: Plaintext.toString('base64'),
                                cipher: CiphertextBlob.toString('base64'),
                            }];
                }
            });
        });
    };
    Kms.prototype.getDataKey = function (dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var dataKeyRecord, encryptedDataKey, kms, Plaintext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getCachedRecordById('kms_data_key', dataKeyId.toString())];
                    case 1:
                        dataKeyRecord = _a.sent();
                        encryptedDataKey = dataKeyRecord.encrypted_data_key;
                        return [4, this.getKMSInstanceByKeyId(dataKeyRecord.cmk_id)];
                    case 2:
                        kms = _a.sent();
                        return [4, kms.decrypt({ CiphertextBlob: Buffer.from(encryptedDataKey, 'base64') }).promise()];
                    case 3:
                        Plaintext = (_a.sent()).Plaintext;
                        return [2, Plaintext.toString('base64')];
                }
            });
        });
    };
    Kms.prototype.encrypt = function (plainText, dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var dataKey, cipher, crypted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof plainText !== 'string') {
                            throw new Error("Only support encrypt string for now.");
                        }
                        return [4, this.getDataKey(dataKeyId)];
                    case 1:
                        dataKey = _a.sent();
                        cipher = crypto_1.default.createCipher(ENCRYPT_ALGORITHM, Buffer.from(dataKey, 'base64'));
                        crypted = cipher.update(plainText, 'utf8', 'hex');
                        crypted += cipher.final('hex');
                        return [2, crypted];
                }
            });
        });
    };
    Kms.prototype.decrypt = function (cipherText, dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var dataKey, decipher, decrypted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dataKeyId) {
                            return [2, cipherText];
                        }
                        return [4, this.getDataKey(dataKeyId)];
                    case 1:
                        dataKey = _a.sent();
                        decipher = crypto_1.default.createDecipher(ENCRYPT_ALGORITHM, Buffer.from(dataKey, 'base64'));
                        decrypted = decipher.update(cipherText, 'hex', 'utf8');
                        decrypted += decipher.final('utf8');
                        return [2, decrypted];
                }
            });
        });
    };
    Kms.prototype.hash = function (plainText, dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = bcryptjs_1.default).hash;
                        return [4, this.combineData(plainText, dataKeyId)];
                    case 1: return [4, _b.apply(_a, [_c.sent(), 7])];
                    case 2:
                        result = _c.sent();
                        return [2, result];
                }
            });
        });
    };
    Kms.prototype.verify = function (plainText, hash, dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = bcryptjs_1.default).compare;
                        return [4, this.combineData(plainText, dataKeyId)];
                    case 1: return [4, _b.apply(_a, [_c.sent(), hash])];
                    case 2:
                        result = _c.sent();
                        return [2, result];
                }
            });
        });
    };
    Kms.prototype.hashWithdrawal = function (wPayload) {
        return __awaiter(this, void 0, void 0, function () {
            var plainText;
            return __generator(this, function (_a) {
                plainText = JSON.stringify({
                    user_id: wPayload.user_id,
                    currency: wPayload.currency,
                    from_address: wPayload.fromAddress,
                    to_address: wPayload.toAddress,
                    amount: wPayload.amount,
                    kms_data_key_id: wPayload.kms_data_key_id,
                    created_at: wPayload.created_at,
                });
                return [2, this.hash(plainText, wPayload.kms_data_key_id)];
            });
        });
    };
    Kms.prototype.verifyWithdrawal = function (withdrawal) {
        return __awaiter(this, void 0, void 0, function () {
            var plainText;
            return __generator(this, function (_a) {
                plainText = JSON.stringify({
                    user_id: withdrawal.user_id,
                    currency: withdrawal.currency,
                    from_address: withdrawal.fromAddress,
                    to_address: withdrawal.toAddress,
                    amount: withdrawal.amount,
                    kms_data_key_id: withdrawal.kms_data_key_id,
                    created_at: withdrawal.created_at,
                });
                return [2, this.verify(plainText, withdrawal.hashCheck, withdrawal.kms_data_key_id)];
            });
        });
    };
    Kms.prototype.getCachedRecordById = function (tableName, id) {
        return __awaiter(this, void 0, void 0, function () {
            var records, record, cached;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!LOCAL_CACHED_RECORDS.get(tableName)) {
                            LOCAL_CACHED_RECORDS.set(tableName, {});
                        }
                        if (LOCAL_CACHED_RECORDS.get(tableName)[id]) {
                            return [2, LOCAL_CACHED_RECORDS.get(tableName)[id]];
                        }
                        return [4, this.connection.query("SELECT * FROM " + tableName + " WHERE id=? LIMIT 1", [id])];
                    case 1:
                        records = _a.sent();
                        if (records.length < 1) {
                            throw new Error("Not found record: table=" + tableName + ", id=" + id);
                        }
                        record = records[0];
                        cached = LOCAL_CACHED_RECORDS.get(tableName);
                        cached[id] = JSON.parse(JSON.stringify(record));
                        LOCAL_CACHED_RECORDS.set(tableName, cached);
                        return [2, LOCAL_CACHED_RECORDS.get(tableName)[id]];
                }
            });
        });
    };
    Kms.prototype.getKMSInstanceByKeyId = function (cmkId) {
        return __awaiter(this, void 0, void 0, function () {
            var cmk;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getCachedRecordById('kms_cmk', cmkId)];
                    case 1:
                        cmk = _a.sent();
                        return [2, new aws_sdk_1.default.KMS({ region: cmk.region })];
                }
            });
        });
    };
    Kms.prototype.combineData = function (plainText, dataKeyId) {
        return __awaiter(this, void 0, void 0, function () {
            var dataKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getDataKey(dataKeyId)];
                    case 1:
                        dataKey = _a.sent();
                        return [2, plainText + ":" + dataKey];
                }
            });
        });
    };
    return Kms;
}());
exports.Kms = Kms;
exports.default = Kms;
//# sourceMappingURL=Kms.js.map