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
exports.Deposit = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Deposit = (function () {
    function Deposit() {
    }
    Deposit.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    Deposit.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Deposit.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'from_address', type: 'text', nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "fromAddress", void 0);
    __decorate([
        typeorm_1.Column({ name: 'to_address', nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "toAddress", void 0);
    __decorate([
        typeorm_1.Column({ nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "txid", void 0);
    __decorate([
        typeorm_1.Column({ type: 'decimal', precision: 32, scale: 0, nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "amount", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Deposit.prototype, "memo", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_number', nullable: false }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "blockNumber", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_timestamp', nullable: false }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "blockTimestamp", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collect_status', nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "collectStatus", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collected_txid' }),
        __metadata("design:type", String)
    ], Deposit.prototype, "collectedTxid", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collected_timestamp', nullable: false }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "collectedTimestamp", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collect_local_tx_id' }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "collectLocalTxId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'seeded_txid' }),
        __metadata("design:type", String)
    ], Deposit.prototype, "seededTxid", void 0);
    __decorate([
        typeorm_1.Column({ name: 'seed_local_tx_id' }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "seedLocalTxId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collect_withdrawal_id' }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "collectWithdrawalId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'collect_type', nullable: false }),
        __metadata("design:type", String)
    ], Deposit.prototype, "collectType", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Deposit.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Deposit.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Deposit.prototype, "updateUpdateDates", null);
    Deposit = __decorate([
        typeorm_1.Entity('deposit')
    ], Deposit);
    return Deposit;
}());
exports.Deposit = Deposit;
//# sourceMappingURL=Deposit.js.map