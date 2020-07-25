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
exports.Wallet = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Wallet = (function () {
    function Wallet() {
    }
    Wallet.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    Wallet.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], Wallet.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'user_id', nullable: false }),
        __metadata("design:type", Number)
    ], Wallet.prototype, "userId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'label', nullable: true }),
        __metadata("design:type", String)
    ], Wallet.prototype, "label", void 0);
    __decorate([
        typeorm_1.Column({ name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], Wallet.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'withdrawal_mode', nullable: false }),
        __metadata("design:type", String)
    ], Wallet.prototype, "withdrawalMode", void 0);
    __decorate([
        typeorm_1.Column({ name: 'secret', nullable: false }),
        __metadata("design:type", String)
    ], Wallet.prototype, "secret", void 0);
    __decorate([
        typeorm_1.Column({ name: 'is_hd', nullable: false }),
        __metadata("design:type", Boolean)
    ], Wallet.prototype, "isHd", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Wallet.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], Wallet.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Wallet.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], Wallet.prototype, "updateUpdateDates", null);
    Wallet = __decorate([
        typeorm_1.Entity('wallet')
    ], Wallet);
    return Wallet;
}());
exports.Wallet = Wallet;
//# sourceMappingURL=Wallet.js.map