"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingKey = exports.WithdrawalMode = exports.CollectType = exports.MailStatus = exports.RefTable = exports.LocalTxStatus = exports.LocalTxType = exports.CollectStatus = exports.WithdrawalStatus = exports.WithdrawalEvent = exports.WithdrawOutType = exports.WalletEvent = exports.DepositEvent = exports.WebhookType = void 0;
var WebhookType;
(function (WebhookType) {
    WebhookType["DEPOSIT"] = "deposit";
    WebhookType["WITHDRAWAL"] = "withdrawal";
})(WebhookType = exports.WebhookType || (exports.WebhookType = {}));
var DepositEvent;
(function (DepositEvent) {
    DepositEvent["CREATED"] = "created";
    DepositEvent["CONFIRMED"] = "confirmed";
    DepositEvent["COLLECT_SENT"] = "collect_sent";
    DepositEvent["COLLECTED"] = "collected";
    DepositEvent["COLLECTED_FAILED"] = "collected_failed";
    DepositEvent["COLLECT_TXID_CHANGED"] = "collect_txid_changed";
    DepositEvent["SEED_SENT"] = "seed_sent";
    DepositEvent["SEEDING"] = "seeding";
    DepositEvent["SEEDED"] = "seeded";
    DepositEvent["SEEDED_FAILED"] = "seeded_failed";
    DepositEvent["SEED_TXID_CHANGED"] = "seed_txid_changed";
    DepositEvent["NOTCOLLECT"] = "notcollect";
})(DepositEvent = exports.DepositEvent || (exports.DepositEvent = {}));
var WalletEvent;
(function (WalletEvent) {
    WalletEvent["CREATED"] = "created";
    WalletEvent["DEPOSIT"] = "deposit";
    WalletEvent["WITHDRAW_REQUEST"] = "withdraw_request";
    WalletEvent["WITHDRAW_COMPLETED"] = "withdraw_completed";
    WalletEvent["WITHDRAW_FAILED"] = "withdraw_failed";
    WalletEvent["WITHDRAW_FEE"] = "withdraw_fee";
    WalletEvent["WITHDRAW_ACCEPTED"] = "withdraw_accepted";
    WalletEvent["WITHDRAW_DECLINED"] = "withdraw_declined";
    WalletEvent["COLLECT_FEE"] = "collect_fee";
    WalletEvent["COLLECT_AMOUNT"] = "collect_amount";
    WalletEvent["COLLECTED_FAIL"] = "collected_fail";
    WalletEvent["COLLECTED"] = "collected";
    WalletEvent["SEEDED_FAIL"] = "seeded_fail";
    WalletEvent["SEEDED"] = "seeded";
    WalletEvent["SEED_FEE"] = "seed_fee";
    WalletEvent["SEED_AMOUNT"] = "seed_amount";
})(WalletEvent = exports.WalletEvent || (exports.WalletEvent = {}));
var WithdrawOutType;
(function (WithdrawOutType) {
    WithdrawOutType["WITHDRAW_OUT_COLD_SUFFIX"] = "_cold_withdrawal";
    WithdrawOutType["WITHDRAW_OUT_NORMAL"] = "normal";
    WithdrawOutType["EXPLICIT_FROM_HOT_WALLET"] = "explicit_from_hot_wallet";
    WithdrawOutType["EXPLICIT_FROM_DEPOSIT_ADDRESS"] = "explicit_from_deposit_address";
    WithdrawOutType["AUTO_COLLECTED_FROM_DEPOSIT_ADDRESS"] = "auto_collected_from_deposit_address";
})(WithdrawOutType = exports.WithdrawOutType || (exports.WithdrawOutType = {}));
var WithdrawalEvent;
(function (WithdrawalEvent) {
    WithdrawalEvent["CREATED"] = "created";
    WithdrawalEvent["PICKED"] = "picked";
    WithdrawalEvent["SIGNED"] = "signed";
    WithdrawalEvent["SENT"] = "sent";
    WithdrawalEvent["COMPLETED"] = "completed";
    WithdrawalEvent["FAILED"] = "failed";
    WithdrawalEvent["TXID_CHANGED"] = "txid_changed";
})(WithdrawalEvent = exports.WithdrawalEvent || (exports.WithdrawalEvent = {}));
var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["INVALID"] = "invalid";
    WithdrawalStatus["UNSIGNED"] = "unsigned";
    WithdrawalStatus["SIGNING"] = "signing";
    WithdrawalStatus["SIGNED"] = "signed";
    WithdrawalStatus["SENT"] = "sent";
    WithdrawalStatus["COMPLETED"] = "completed";
    WithdrawalStatus["FAILED"] = "failed";
})(WithdrawalStatus = exports.WithdrawalStatus || (exports.WithdrawalStatus = {}));
var CollectStatus;
(function (CollectStatus) {
    CollectStatus["UNCOLLECTED"] = "uncollected";
    CollectStatus["COLLECTING_FORWARDING"] = "forwarding";
    CollectStatus["COLLECTING"] = "collecting";
    CollectStatus["COLLECT_SIGNED"] = "collect_signed";
    CollectStatus["COLLECT_SENT"] = "collect_sent";
    CollectStatus["COLLECTED"] = "collected";
    CollectStatus["NOTCOLLECT"] = "notcollect";
    CollectStatus["SEED_REQUESTED"] = "seed_requested";
    CollectStatus["SEEDING"] = "seeding";
    CollectStatus["SEED_SIGNED"] = "seed_signed";
    CollectStatus["SEED_SENT"] = "seed_sent";
    CollectStatus["SEEDED"] = "seeded";
})(CollectStatus = exports.CollectStatus || (exports.CollectStatus = {}));
var LocalTxType;
(function (LocalTxType) {
    LocalTxType["DEPOSIT"] = "deposit";
    LocalTxType["WITHDRAWAL_NORMAL"] = "withdrawal_normal";
    LocalTxType["WITHDRAWAL_COLD"] = "withdrawal_cold";
    LocalTxType["SEED"] = "seed";
    LocalTxType["COLLECT"] = "collect";
    LocalTxType["WITHDRAWAL_COLLECT"] = "withdrawal_collect";
})(LocalTxType = exports.LocalTxType || (exports.LocalTxType = {}));
var LocalTxStatus;
(function (LocalTxStatus) {
    LocalTxStatus["INVALID"] = "invalid";
    LocalTxStatus["UNSIGNED"] = "unsigned";
    LocalTxStatus["SIGNING"] = "signing";
    LocalTxStatus["SIGNED"] = "signed";
    LocalTxStatus["SENT"] = "sent";
    LocalTxStatus["COMPLETED"] = "completed";
    LocalTxStatus["FAILED"] = "failed";
})(LocalTxStatus = exports.LocalTxStatus || (exports.LocalTxStatus = {}));
var RefTable;
(function (RefTable) {
    RefTable["DEPOSIT"] = "deposit";
    RefTable["WITHDRAWAL"] = "withdrawal";
})(RefTable = exports.RefTable || (exports.RefTable = {}));
var MailStatus;
(function (MailStatus) {
    MailStatus["CREATED"] = "created";
    MailStatus["SENT"] = "sent";
    MailStatus["FAILED"] = "failed";
})(MailStatus = exports.MailStatus || (exports.MailStatus = {}));
var CollectType;
(function (CollectType) {
    CollectType["WITHDRAWAL"] = "withdrawal";
    CollectType["INTERNAL_TRANSFER"] = "internal_transfer";
})(CollectType = exports.CollectType || (exports.CollectType = {}));
var WithdrawalMode;
(function (WithdrawalMode) {
    WithdrawalMode["NORMAL"] = "normal";
})(WithdrawalMode = exports.WithdrawalMode || (exports.WithdrawalMode = {}));
var SettingKey;
(function (SettingKey) {
    SettingKey["ETH_FEE_THRESHOLD"] = "eth_fee_threshold";
    SettingKey["MAX_FEE_BY_USD"] = "max_fee_by_usd";
})(SettingKey = exports.SettingKey || (exports.SettingKey = {}));
//# sourceMappingURL=Enums.js.map