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
var WithdrawalLog = (function () {
    function WithdrawalLog() {
    }
    WithdrawalLog.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], WithdrawalLog.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'withdrawal_id', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalLog.prototype, "withdrawalId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'ref_id', nullable: false }),
        __metadata("design:type", Number)
    ], WithdrawalLog.prototype, "refId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'event', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalLog.prototype, "event", void 0);
    __decorate([
        typeorm_1.Column({ name: 'data', nullable: false }),
        __metadata("design:type", String)
    ], WithdrawalLog.prototype, "data", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WithdrawalLog.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WithdrawalLog.prototype, "updateCreateDates", null);
    WithdrawalLog = __decorate([
        typeorm_1.Entity('withdrawal_log')
    ], WithdrawalLog);
    return WithdrawalLog;
}());
exports.WithdrawalLog = WithdrawalLog;
//# sourceMappingURL=WithdrawalLog.js.map