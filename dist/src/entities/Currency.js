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
exports.Currency = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Currency = (function () {
    function Currency() {
    }
    Currency.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    Currency.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryColumn('bigint', { name: 'id', nullable: false }),
        __metadata("design:type", Number)
    ], Currency.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], Currency.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], Currency.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'symbol', nullable: false }),
        __metadata("design:type", String)
    ], Currency.prototype, "symbol", void 0);
    __decorate([
        typeorm_1.Column({ name: 'withdrawal_mode', nullable: false }),
        __metadata("design:type", String)
    ], Currency.prototype, "withdrawalMode", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'minimum_withdrawal',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], Currency.prototype, "minimumWithdrawal", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'minimum_collect_amount',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], Currency.prototype, "minimumCollectAmount", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'lower_threshold',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], Currency.prototype, "lowerThreshold", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'upper_threshold',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], Currency.prototype, "upperThreshold", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'middle_threshold',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: true,
        }),
        __metadata("design:type", String)
    ], Currency.prototype, "middleThreshold", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Currency.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Currency.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Currency.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Currency.prototype, "updateUpdateDates", null);
    Currency = __decorate([
        typeorm_1.Entity('currency')
    ], Currency);
    return Currency;
}());
exports.Currency = Currency;
//# sourceMappingURL=Currency.js.map