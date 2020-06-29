"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./doCheckKmsConfig"));
__export(require("./doCheckKmsDataKey"));
__export(require("./doCheckUserWallet"));
__export(require("./doCheckWalletBalance"));
__export(require("./doCheckCurrencyConfig"));
__export(require("./doCheckUserCurrency"));
__export(require("./doCheckHotWallet"));
__export(require("./doCheckColdWallet"));
__export(require("./doCheckRallyWallet"));
__export(require("./doCheckWebhook"));
__export(require("./doCheckWithdrawal"));
__export(require("./doCheckCrawler"));
function getOverTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    hours = hours - days * 24;
    minutes = minutes - days * 24 * 60 - hours * 60;
    return days + " days " + hours + " hours " + minutes + " minutes";
}
exports.getOverTime = getOverTime;
//# sourceMappingURL=index.js.map