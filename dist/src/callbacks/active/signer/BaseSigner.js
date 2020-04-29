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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var sota_common_1 = require("sota-common");
var entities_1 = require("../../../entities");
var Enums_1 = require("../../../Enums");
var rawdb = __importStar(require("../../../rawdb"));
var logger = sota_common_1.getLogger('BaseSigner');
var BaseSigner = (function () {
    function BaseSigner(localTx) {
        this.localTx = localTx;
        this.currency = sota_common_1.CurrencyRegistry.getOneCurrency(localTx.currency);
        this.gateway = sota_common_1.GatewayRegistry.getGatewayInstance(this.currency);
    }
    BaseSigner.prototype.proceed = function (manager, failedCounter) {
        return __awaiter(this, void 0, void 0, function () {
            var newFailedCounter;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.manager = manager;
                        return [4, this.prepare()];
                    case 1:
                        _a.sent();
                        return [4, this.isBusy()];
                    case 2:
                        if (!_a.sent()) return [3, 4];
                        newFailedCounter = failedCounter + 1;
                        if (newFailedCounter % 50 === 0) {
                            logger.error("No available hot wallet walletId=" + this.localTx.walletId + " currency=" + this.currency + " failedCounter=" + newFailedCounter);
                        }
                        else {
                            logger.info("No available hot wallet at the moment: walletId=" + this.localTx.walletId + " currency=" + this.currency.symbol);
                        }
                        return [4, rawdb.updateRecordsTimestamp(manager, entities_1.LocalTx, [this.localTx.id])];
                    case 3:
                        _a.sent();
                        return [2, newFailedCounter];
                    case 4: return [4, this.signTx()];
                    case 5:
                        _a.sent();
                        return [4, this.saveSignedTx()];
                    case 6:
                        _a.sent();
                        logger.info("Signed localTx id=" + this.localTx.id + ", platform=" + this.currency.platform + ", txid=" + this.localTx.txid);
                        return [2, 0];
                }
            });
        });
    };
    BaseSigner.prototype.saveSignedTx = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.localTx.status = Enums_1.LocalTxStatus.SIGNED;
                        this.localTx.txid = this.signedTx.txid;
                        this.localTx.signedRaw = this.signedTx.signedRaw;
                        return [4, this.manager.getRepository(entities_1.LocalTx).save(this.localTx)];
                    case 1:
                        _a.sent();
                        return [4, this.updateRelatedTables()];
                    case 2:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    return BaseSigner;
}());
exports.BaseSigner = BaseSigner;
//# sourceMappingURL=BaseSigner.js.map