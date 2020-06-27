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
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var MaxFee = (function () {
    function MaxFee() {
    }
    MaxFee.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    MaxFee.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({ name: 'id', type: 'bigint' }),
        __metadata("design:type", Number)
    ], MaxFee.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'currency', type: 'varchar', nullable: false }),
        __metadata("design:type", String)
    ], MaxFee.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'price_by_usd',
            type: 'decimal',
            precision: 20,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], MaxFee.prototype, "priceByUsd", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'estimate_fee',
            type: 'decimal',
            precision: 40,
            scale: 8,
            nullable: false,
        }),
        __metadata("design:type", String)
    ], MaxFee.prototype, "estimateFee", void 0);
    __decorate([
        typeorm_1.Column({
            name: 'fee_by_usd',
            type: 'decimal',
            precision: 20,
            scale: 8,
            nullable: false,
            comment: 'calculated according to the formula: price_by_usd * (estimate_fee/decimal)'
        }),
        __metadata("design:type", String)
    ], MaxFee.prototype, "feeByUsd", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], MaxFee.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], MaxFee.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], MaxFee.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], MaxFee.prototype, "updateUpdateDates", null);
    MaxFee = __decorate([
        typeorm_1.Entity('max_fee')
    ], MaxFee);
    return MaxFee;
}());
exports.MaxFee = MaxFee;
//# sourceMappingURL=MaxFee.js.map