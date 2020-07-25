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
exports.WalletLog = void 0;
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var WalletLog = (function () {
    function WalletLog() {
    }
    WalletLog.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    WalletLog.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], WalletLog.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'wallet_id', nullable: false }),
        __metadata("design:type", Number)
    ], WalletLog.prototype, "walletId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], WalletLog.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'ref_currency', nullable: false }),
        __metadata("design:type", String)
    ], WalletLog.prototype, "refCurrency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'event', nullable: false }),
        __metadata("design:type", String)
    ], WalletLog.prototype, "event", void 0);
    __decorate([
        typeorm_1.Column({ name: 'balance_change', nullable: false }),
        __metadata("design:type", String)
    ], WalletLog.prototype, "balanceChange", void 0);
    __decorate([
        typeorm_1.Column({ name: 'data', nullable: false }),
        __metadata("design:type", String)
    ], WalletLog.prototype, "data", void 0);
    __decorate([
        typeorm_1.Column({ name: 'ref_id', nullable: false }),
        __metadata("design:type", Number)
    ], WalletLog.prototype, "refId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WalletLog.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WalletLog.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WalletLog.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WalletLog.prototype, "updateUpdateDates", null);
    WalletLog = __decorate([
        typeorm_1.Entity('wallet_log')
    ], WalletLog);
    return WalletLog;
}());
exports.WalletLog = WalletLog;
//# sourceMappingURL=WalletLog.js.map