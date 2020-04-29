"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var registry = new Map();
exports.CurrencyDepositFactory = {
    register: function (currency, callback) {
        registry.set(currency.symbol, callback);
    },
    create: function (currency) {
        var callback = registry.get(currency.symbol);
        if (!callback) {
            throw new Error("Callback for currency " + currency.symbol + " wasn't set yet.");
        }
        return callback();
    },
};
exports.default = exports.CurrencyDepositFactory;
//# sourceMappingURL=CurrencyDepositFactory.js.map