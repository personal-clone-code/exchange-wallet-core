"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalTx = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Enums_1 = require("../Enums");
var LocalTx = (function () {
    function LocalTx() {
    }
    LocalTx.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    LocalTx.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    LocalTx.prototype.isTemporaryTransaction = function () {
        if (!this.txid) {
            return true;
        }
        if (this.txid.startsWith('TMP_')) {
            return true;
        }
        return false;
    };
    LocalTx.prototype.isWithdrawal = function () {
        return this.type === Enums_1.LocalTxType.WITHDRAWAL_NORMAL || this.type === Enums_1.LocalTxType.WITHDRAWAL_COLD;
    };
    LocalTx.prototype.isSeedTx = function () {
        return this.type === Enums_1.LocalTxType.SEED;
    };
    LocalTx.prototype.isCollectTx = function () {
        return this.type === Enums_1.LocalTxType.COLLECT;
    };
    LocalTx.prototype.isWithdrawalCollect = function () {
        return this.type === Enums_1.LocalTxType.WITHDRAWAL_COLLECT;
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'from_address', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "fromAddress", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'to_address', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "toAddress", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'txid', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "txid", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 200, name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 40, name: 'currency_symbol', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "currencySymbol", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 200, name: 'ref_currency', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "refCurrency", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 200, name: 'ref_currency_symbol', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "refCurrencySymbol", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 40, name: 'type', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "type", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 100, name: 'ref_table', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "refTable", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'ref_id', nullable: false }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "refId", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'memo', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "memo", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 20, name: 'status', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "status", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'unsigned_txid', nullable: false, unique: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "unsignedTxid", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_number', nullable: false }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "blockNumber", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_hash', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "blockHash", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_timestamp', nullable: false }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "blockTimestamp", void 0);
    __decorate([
        typeorm_1.Column({ name: 'amount' }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "amount", void 0);
    __decorate([
        typeorm_1.Column({ name: 'fee_amount', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "feeAmount", void 0);
    __decorate([
        typeorm_1.Column({ name: 'fee_currency', nullable: false }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "feeCurrency", void 0);
    __decorate([
        typeorm_1.Column('text', { name: 'unsigned_raw', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "unsignedRaw", void 0);
    __decorate([
        typeorm_1.Column('text', { name: 'signed_raw', nullable: true }),
        __metadata("design:type", String)
    ], LocalTx.prototype, "signedRaw", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], LocalTx.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], LocalTx.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], LocalTx.prototype, "updateUpdateDates", null);
    LocalTx = __decorate([
        typeorm_1.Entity('local_tx')
    ], LocalTx);
    return LocalTx;
}());
exports.LocalTx = LocalTx;
//# sourceMappingURL=LocalTx.js.map