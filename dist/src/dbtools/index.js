"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverTime = void 0;
__exportStar(require("./doCheckKmsConfig"), exports);
__exportStar(require("./doCheckKmsDataKey"), exports);
__exportStar(require("./doCheckUserWallet"), exports);
__exportStar(require("./doCheckWalletBalance"), exports);
__exportStar(require("./doCheckCurrencyConfig"), exports);
__exportStar(require("./doCheckUserCurrency"), exports);
__exportStar(require("./doCheckHotWallet"), exports);
__exportStar(require("./doCheckColdWallet"), exports);
__exportStar(require("./doCheckRallyWallet"), exports);
__exportStar(require("./doCheckWebhook"), exports);
__exportStar(require("./doCheckWithdrawal"), exports);
__exportStar(require("./doCheckCrawler"), exports);
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