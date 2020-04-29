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
var typeorm_1 = require("typeorm");
var entities_1 = require("../entities");
var sota_common_1 = require("sota-common");
var Kms_1 = __importDefault(require("../encrypt/Kms"));
var logger = sota_common_1.getLogger('DBTools::# KmsDataKey::');
function doCheckKmsDataKey() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection().transaction(function (manager) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, _doCheckKmsDataKey(manager)];
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
exports.doCheckKmsDataKey = doCheckKmsDataKey;
function _doCheckKmsDataKey(manager) {
    return __awaiter(this, void 0, void 0, function () {
        var kmsDataKeyErrors, kmsDataKey, plainText, cipherText, e_1, decryptText, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                    logger.info("Start checking...");
                    kmsDataKeyErrors = [];
                    return [4, manager.getRepository(entities_1.KmsDataKey).findOne({
                            isEnabled: 1,
                        })];
                case 1:
                    kmsDataKey = _a.sent();
                    if (!!kmsDataKey) return [3, 2];
                    kmsDataKeyErrors.push("No KMS data key in database.");
                    return [3, 10];
                case 2:
                    plainText = 'Sotatek@123';
                    cipherText = void 0;
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4, Kms_1.default.getInstance().encrypt(plainText, kmsDataKey.id)];
                case 4:
                    cipherText = _a.sent();
                    return [3, 6];
                case 5:
                    e_1 = _a.sent();
                    kmsDataKeyErrors.push(e_1.toString());
                    return [3, 6];
                case 6:
                    if (!cipherText) return [3, 10];
                    _a.label = 7;
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    return [4, Kms_1.default.getInstance().decrypt(plainText, kmsDataKey.id)];
                case 8:
                    decryptText = _a.sent();
                    if (decryptText !== plainText) {
                        kmsDataKeyErrors.push("Decrypted data is wrong, plainText=" + plainText + ", decryptText=" + decryptText);
                    }
                    return [3, 10];
                case 9:
                    e_2 = _a.sent();
                    kmsDataKeyErrors.push(e_2.toString());
                    return [3, 10];
                case 10:
                    logger.info("" + JSON.stringify({
                        isOK: kmsDataKeyErrors.length === 0,
                        totalErrors: kmsDataKeyErrors.length,
                        details: kmsDataKeyErrors,
                    }));
                    logger.info("Finished!");
                    logger.info("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=doCheckKmsDataKey.js.map