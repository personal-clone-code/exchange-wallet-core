"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.CollectingSigner = void 0;
var BaseSigner_1 = require("./BaseSigner");
var rawdb = __importStar(require("../../../rawdb"));
var entities_1 = require("../../../entities");
var Enums_1 = require("../../../Enums");
var CollectingSigner = (function (_super) {
    __extends(CollectingSigner, _super);
    function CollectingSigner() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CollectingSigner.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this;
                        return [4, rawdb.findDepositsInCollectingTx(this.manager, this.localTx.id)];
                    case 1:
                        _a.deposits = _c.sent();
                        _b = this;
                        return [4, rawdb.findAddresses(this.manager, this.deposits.map(function (e) { return e.toAddress; }))];
                    case 2:
                        _b.signingAddresses = _c.sent();
                        return [2];
                }
            });
        });
    };
    CollectingSigner.prototype.isBusy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i, len;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0, len = this.signingAddresses.length;
                        _a.label = 1;
                    case 1:
                        if (!(i < len)) return [3, 4];
                        return [4, rawdb.checkAddressBusy(this.manager, this.signingAddresses[i].address)];
                    case 2:
                        if (_a.sent()) {
                            return [2, true];
                        }
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3, 1];
                    case 4: return [2, false];
                }
            });
        });
    };
    CollectingSigner.prototype.signTx = function () {
        return __awaiter(this, void 0, void 0, function () {
            var rawPrivateKeys, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4, Promise.all(this.signingAddresses.map(function (sa) { return sa.extractRawPrivateKey(); }))];
                    case 1:
                        rawPrivateKeys = _c.sent();
                        if (!this.currency.isUTXOBased) return [3, 3];
                        _a = this;
                        return [4, this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKeys)];
                    case 2:
                        _a.signedTx = _c.sent();
                        return [3, 5];
                    case 3:
                        _b = this;
                        return [4, this.gateway.signRawTransaction(this.localTx.unsignedRaw, rawPrivateKeys[0])];
                    case 4:
                        _b.signedTx = _c.sent();
                        _c.label = 5;
                    case 5: return [2];
                }
            });
        });
    };
    CollectingSigner.prototype.updateRelatedTables = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Promise.all(this.deposits.map(function (deposit) {
                            _this.manager.getRepository(entities_1.Deposit).update({
                                id: deposit.id,
                            }, {
                                collectStatus: Enums_1.CollectStatus.COLLECT_SIGNED,
                                collectedTxid: _this.signedTx.txid,
                            });
                        }))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    return CollectingSigner;
}(BaseSigner_1.BaseSigner));
exports.CollectingSigner = CollectingSigner;
//# sourceMappingURL=CollectingSigner.js.map