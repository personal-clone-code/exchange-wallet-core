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
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var ColdWallet = (function () {
    function ColdWallet() {
    }
    ColdWallet.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    ColdWallet.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.Column('int', { name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], ColdWallet.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column('int', { name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], ColdWallet.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'address', nullable: false }),
        __metadata("design:type", String)
    ], ColdWallet.prototype, "address", void 0);
    __decorate([
        typeorm_1.Column({ name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], ColdWallet.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'type' }),
        __metadata("design:type", String)
    ], ColdWallet.prototype, "type", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], ColdWallet.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], ColdWallet.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ColdWallet.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ColdWallet.prototype, "updateUpdateDates", null);
    ColdWallet = __decorate([
        typeorm_1.Entity('cold_wallet')
    ], ColdWallet);
    return ColdWallet;
}());
exports.ColdWallet = ColdWallet;
//# sourceMappingURL=ColdWallet.js.map