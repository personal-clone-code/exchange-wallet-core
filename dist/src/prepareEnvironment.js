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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareEnvironment = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var entities_1 = require("./entities");
var callbacks_1 = require("./callbacks");
var OmniToken_1 = require("./entities/OmniToken");
var logger = sota_common_1.getLogger('prepareEnvironment');
function prepareEnvironment() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, _a, currencyConfigs, envConfigs, erc20Tokens, trc20Tokens, eosTokens, omniTokens, nemEnvConfigs, erc20Currencies, trc20Currencies, omniCurrencies, eosCurrencies, redisHost, redisPort, redisUrl, redisSubscriber;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    logger.info("Application has been started.");
                    logger.info("Preparing DB connection...");
                    return [4, typeorm_1.createConnection({
                            name: 'default',
                            type: 'mysql',
                            host: process.env.TYPEORM_HOST,
                            port: process.env.TYPEORM_PORT ? parseInt(process.env.TYPEORM_PORT, 10) : 3306,
                            username: process.env.TYPEORM_USERNAME,
                            password: process.env.TYPEORM_PASSWORD,
                            database: process.env.TYPEORM_DATABASE,
                            synchronize: false,
                            logging: process.env.TYPEORM_LOGGING ? process.env.TYPEORM_LOGGING === 'true' : true,
                            cache: process.env.TYPEORM_CACHE ? process.env.TYPEORM_CACHE === 'true' : true,
                            entities: process.env.TYPEORM_ENTITIES.split(','),
                        })];
                case 1:
                    _b.sent();
                    logger.info("DB connected successfully...");
                    connection = typeorm_1.getConnection();
                    logger.info("Loading environment configurations from database...");
                    return [4, Promise.all([
                            connection.getRepository(entities_1.CurrencyConfig).find({}),
                            connection.getRepository(entities_1.EnvConfig).find({}),
                            connection.getRepository(entities_1.Erc20Token).find({}),
                            connection.getRepository(entities_1.Trc20Token).find({}),
                            connection.getRepository(entities_1.EosToken).find({}),
                            connection.getRepository(OmniToken_1.OmniToken).find({}),
                        ])];
                case 2:
                    _a = _b.sent(), currencyConfigs = _a[0], envConfigs = _a[1], erc20Tokens = _a[2], trc20Tokens = _a[3], eosTokens = _a[4], omniTokens = _a[5];
                    envConfigs.forEach(function (config) {
                        sota_common_1.EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
                    });
                    return [4, connection.getRepository(entities_1.NemEnvConfig).find({})];
                case 3:
                    nemEnvConfigs = _b.sent();
                    nemEnvConfigs.forEach(function (config) {
                        sota_common_1.EnvConfigRegistry.setCustomEnvConfig(config.key, config.value);
                    });
                    erc20Currencies = [];
                    erc20Tokens.forEach(function (token) {
                        sota_common_1.CurrencyRegistry.registerErc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
                        erc20Currencies.push(sota_common_1.CurrencyRegistry.getOneCurrency("erc20." + token.contractAddress));
                    });
                    trc20Currencies = [];
                    trc20Tokens.forEach(function (token) {
                        sota_common_1.CurrencyRegistry.registerTrc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
                        trc20Currencies.push(sota_common_1.CurrencyRegistry.getOneCurrency("trc20." + token.contractAddress));
                    });
                    omniCurrencies = [];
                    omniTokens.forEach(function (token) {
                        sota_common_1.CurrencyRegistry.registerOmniAsset(token.propertyId, token.symbol, token.name, token.scale);
                        omniCurrencies.push(sota_common_1.CurrencyRegistry.getOneCurrency("omni." + token.propertyId));
                    });
                    eosCurrencies = [];
                    eosTokens.forEach(function (token) {
                        sota_common_1.CurrencyRegistry.registerEosToken(token.code, token.symbol, token.scale);
                        eosCurrencies.push(sota_common_1.CurrencyRegistry.getOneCurrency("eos." + token.symbol));
                    });
                    currencyConfigs.forEach(function (config) {
                        if (!sota_common_1.CurrencyRegistry.hasOneCurrency(config.currency)) {
                            throw new Error("There's config for unknown currency: " + config.currency);
                        }
                        var currency = sota_common_1.CurrencyRegistry.getOneCurrency(config.currency);
                        sota_common_1.CurrencyRegistry.setCurrencyConfig(currency, config);
                    });
                    if (sota_common_1.EnvConfigRegistry.isUsingRedis()) {
                        redisHost = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('REDIS_HOST');
                        redisPort = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('REDIS_PORT');
                        redisUrl = sota_common_1.EnvConfigRegistry.getCustomEnvConfig('REDIS_URL');
                        if ((!redisHost && !redisUrl) || (!redisPort && !redisUrl)) {
                            throw new Error("Some redis configs are missing. REDIS_HOST=" + redisHost + ", REDIS_PORT=" + redisPort + ", REDIS_URL=" + redisUrl);
                        }
                    }
                    redisSubscriber = sota_common_1.getRedisSubscriber();
                    redisSubscriber.on('message', onRedisMessage);
                    return [4, sota_common_1.settleEnvironment()];
                case 4:
                    _b.sent();
                    return [4, sota_common_1.Utils.PromiseAll([
                            callbacks_1.prepareWalletBalanceAll(__spreadArrays(eosCurrencies, [sota_common_1.CurrencyRegistry.EOS])),
                            callbacks_1.prepareWalletBalanceAll(__spreadArrays(trc20Currencies, [sota_common_1.CurrencyRegistry.Tomo])),
                            callbacks_1.prepareWalletBalanceAll(__spreadArrays(erc20Currencies, [sota_common_1.CurrencyRegistry.Ethereum])),
                            callbacks_1.prepareWalletBalanceAll(__spreadArrays(omniCurrencies, [sota_common_1.CurrencyRegistry.Bitcoin])),
                        ])];
                case 5:
                    _b.sent();
                    logger.info("Environment has been setup successfully...");
                    return [2];
            }
        });
    });
}
exports.prepareEnvironment = prepareEnvironment;
function onRedisMessage(channel, message) {
    var appId = sota_common_1.EnvConfigRegistry.getAppId();
    if (appId !== channel) {
        return;
    }
    if (message === 'EVENT_NEW_ERC20_TOKEN_ADDED' || message === 'EVENT_NEW_ERC20_TOKEN_REMOVED') {
        logger.warn("RedisChannel::subscribeRedisChannel on message=" + message + ". Will exit to respawn...");
        process.exit(0);
    }
    var messageObj = null;
    try {
        messageObj = JSON.parse(message);
    }
    catch (e) {
        logger.warn("Unexpected message from redis: " + message);
    }
    if (!messageObj) {
        return;
    }
    if (messageObj) {
        var contractAddress_1 = messageObj.data.toString();
        switch (messageObj.event) {
            case 'EVENT_NEW_ERC20_TOKEN_ADDED':
                findAndRegisterNewErc20Token(contractAddress_1).catch(function (e) {
                    logger.error("Could not find and load new added ERC20 token [" + contractAddress_1 + "] due to error:");
                    logger.error(e);
                });
                break;
            case 'EVENT_NEW_ERC20_TOKEN_REMOVED':
                findAndUnregisterErc20Token(contractAddress_1).catch(function (e) {
                    logger.error("Could not find and delete added ERC20 token [" + contractAddress_1 + "] due to error:");
                    logger.error(e);
                });
                break;
            default:
                break;
        }
    }
}
function findAndRegisterNewErc20Token(contractAddress) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connection = typeorm_1.getConnection();
                    return [4, connection.getRepository(entities_1.Erc20Token).findOne({ contractAddress: contractAddress })];
                case 1:
                    token = _a.sent();
                    if (!token) {
                        throw new Error("Could not find ERC20 token in database: " + contractAddress);
                    }
                    sota_common_1.CurrencyRegistry.registerErc20Token(token.contractAddress, token.symbol, token.name, token.decimal);
                    logger.info("Register new added ERC20 token: contract=" + token.contractAddress + " symbol=" + token.symbol);
                    return [2];
            }
        });
    });
}
function findAndUnregisterErc20Token(contractAddress) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            sota_common_1.CurrencyRegistry.unregisterErc20Token(contractAddress);
            logger.info("Unregister new added ERC20 token: contract=" + contractAddress);
            return [2];
        });
    });
}
//# sourceMappingURL=prepareEnvironment.js.map