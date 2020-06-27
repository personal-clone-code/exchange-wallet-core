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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var entities_1 = require("../entities");
var rawdb = __importStar(require("../rawdb"));
var fs_1 = __importDefault(require("fs"));
var logger = sota_common_1.getLogger('initAddressBalance');
var PAGE_SIZE = 10;
var PAGE_IDX_FILE = "/var/tmp/" + sota_common_1.EnvConfigRegistry.getAppId() + "_initAddressBalance_pageIdx";
var pageIdx = 0;
loadPageIdx();
function initAddressBalance() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, repository, addresses, tasks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, typeorm_1.getConnection()];
                case 1:
                    connection = _a.sent();
                    repository = connection.getRepository(entities_1.Address);
                    return [4, repository.find({
                            order: {
                                createdAt: 'ASC',
                            },
                            skip: pageIdx * PAGE_SIZE,
                            take: PAGE_SIZE,
                        })];
                case 2:
                    addresses = _a.sent();
                    logger.info("page: " + pageIdx + ", addresses: " + addresses.length);
                    if (addresses.length <= 0) {
                        return [2];
                    }
                    tasks = [];
                    addresses.map(function (address) {
                        sota_common_1.CurrencyRegistry.getCurrenciesOfPlatform(address.currency).map(function (currency) {
                            logger.info("add task: " + address.walletId + " | " + currency.symbol + " | " + address.address);
                            tasks.push(rawdb.updateAddressBalanceFromNetwork(connection.manager, address.walletId, currency.symbol, address.address));
                        });
                    });
                    return [4, Promise.all(tasks)];
                case 3:
                    _a.sent();
                    pageIdx++;
                    savePageIdx();
                    return [2];
            }
        });
    });
}
exports.default = initAddressBalance;
exports.initAddressBalance = initAddressBalance;
function loadPageIdx() {
    try {
        if (fs_1.default.existsSync(PAGE_IDX_FILE)) {
            pageIdx = parseInt(fs_1.default.readFileSync(PAGE_IDX_FILE).toString(), 10) || 0;
        }
    }
    catch (err) {
        logger.error(err);
    }
}
function savePageIdx() {
    try {
        fs_1.default.writeFileSync(PAGE_IDX_FILE, pageIdx.toString());
    }
    catch (err) {
        logger.error(err);
    }
}
//# sourceMappingURL=initAddressBalance.js.map