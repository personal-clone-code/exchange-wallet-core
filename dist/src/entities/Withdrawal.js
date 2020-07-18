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
exports.Withdrawal = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Withdrawal = (function () {
    function Withdrawal() {
    }
    Withdrawal.prototype.getAmount = function () {
        return new sota_common_1.BigNumber(this.amount);
    };
    Withdrawal.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    Withdrawal.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({ name: 'id', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'withdrawal_tx_id', nullable: false }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "withdrawalTxId", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 100, name: 'txid', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "txid", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 100, name: 'from_address', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "fromAddress", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 100, name: 'to_address', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "toAddress", void 0);
    __decorate([
        typeorm_1.Column('decimal', { name: 'amount', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "amount", void 0);
    __decorate([
        typeorm_1.Column('varchar', { length: 20, name: 'status', nullable: false }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "status", void 0);
    __decorate([
        typeorm_1.Column('varchar', { name: 'memo', nullable: true }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "memo", void 0);
    __decorate([
        typeorm_1.Column({ name: 'type', type: 'varchar' }),
        __metadata("design:type", String)
    ], Withdrawal.prototype, "type", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Withdrawal.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Withdrawal.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Withdrawal.prototype, "updateUpdateDates", null);
    Withdrawal = __decorate([
        typeorm_1.Entity('withdrawal')
    ], Withdrawal);
    return Withdrawal;
}());
exports.Withdrawal = Withdrawal;
//# sourceMappingURL=Withdrawal.js.map