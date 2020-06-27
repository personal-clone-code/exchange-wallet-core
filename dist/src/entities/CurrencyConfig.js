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
var CurrencyConfig = (function () {
    function CurrencyConfig() {
    }
    CurrencyConfig.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    CurrencyConfig.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'currency', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "currency", void 0);
    __decorate([
        typeorm_1.Column({ name: 'network', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "network", void 0);
    __decorate([
        typeorm_1.Column({ name: 'chain_id', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "chainId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'chain_name', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "chainName", void 0);
    __decorate([
        typeorm_1.Column({ name: 'average_block_time', nullable: false }),
        __metadata("design:type", Number)
    ], CurrencyConfig.prototype, "averageBlockTime", void 0);
    __decorate([
        typeorm_1.Column({ name: 'required_confirmations', nullable: false }),
        __metadata("design:type", Number)
    ], CurrencyConfig.prototype, "requiredConfirmations", void 0);
    __decorate([
        typeorm_1.Column({ name: 'internal_endpoint', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "internalEndpoint", void 0);
    __decorate([
        typeorm_1.Column({ name: 'rpc_endpoint', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "rpcEndpoint", void 0);
    __decorate([
        typeorm_1.Column({ name: 'rest_endpoint', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "restEndpoint", void 0);
    __decorate([
        typeorm_1.Column({ name: 'explorer_endpoint', nullable: false }),
        __metadata("design:type", String)
    ], CurrencyConfig.prototype, "explorerEndpoint", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], CurrencyConfig.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], CurrencyConfig.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CurrencyConfig.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CurrencyConfig.prototype, "updateUpdateDates", null);
    CurrencyConfig = __decorate([
        typeorm_1.Entity('currency_config')
    ], CurrencyConfig);
    return CurrencyConfig;
}());
exports.CurrencyConfig = CurrencyConfig;
//# sourceMappingURL=CurrencyConfig.js.map