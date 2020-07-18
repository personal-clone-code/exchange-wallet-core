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
exports.WithdrawalTx = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var WithdrawalTx = (function () {
    function WithdrawalTx() {
    }
    WithdrawalTx.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    WithdrawalTx.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'hot_wallet_address', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "hotWalletAddress", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'txid', nullable: true, unique: true }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "txid", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 20, name: 'status', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "status", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 10, name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'unsigned_txid', nullable: false, unique: true }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "unsignedTxid", void 0);
    __decorate([
        typeorm_1.Column('text', { name: 'unsigned_raw', nullable: true }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "unsignedRaw", void 0);
    __decorate([
        typeorm_1.Column('text', { name: 'signed_raw', nullable: true }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "signedRaw", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_number', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "blockNumber", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_hash', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "blockHash", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_timestamp', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "blockTimestamp", void 0);
    __decorate([
        typeorm_1.Column({ name: 'fee_amount', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "feeAmount", void 0);
    __decorate([
        typeorm_1.Column({ name: 'fee_currency', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalTx.prototype, "feeCurrency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WithdrawalTx.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WithdrawalTx.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WithdrawalTx.prototype, "updateUpdateDates", null);
    WithdrawalTx = __decorate([
        typeorm_1.Entity('withdrawal_tx'),
        typeorm_1.Index('withdrawal_raw_unsigned_txid_unique', ['unsignedTxid'], {
            unique: true,
        }),
        typeorm_1.Index('withdrawal_raw_txid_unique', ['txid'], { unique: true }),
        typeorm_1.Index('withdrawal_raw_created_at_index', ['createdAt']),
        typeorm_1.Index('withdrawal_raw_updated_at_index', ['updatedAt'])
    ], WithdrawalTx);
    return WithdrawalTx;
}());
exports.WithdrawalTx = WithdrawalTx;
//# sourceMappingURL=WithdrawalTx.js.map