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
var CoinMarketCapKey = (function () {
    function CoinMarketCapKey() {
    }
    CoinMarketCapKey.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    CoinMarketCapKey.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'id', type: 'int', nullable: false, unsigned: true }),
        __metadata("design:type", Number)
    ], CoinMarketCapKey.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'key', type: 'varchar', nullable: false }),
        __metadata("design:type", String)
    ], CoinMarketCapKey.prototype, "key", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], CoinMarketCapKey.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], CoinMarketCapKey.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CoinMarketCapKey.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], CoinMarketCapKey.prototype, "updateUpdateDates", null);
    CoinMarketCapKey = __decorate([
        typeorm_1.Entity('coinmarketcap_key')
    ], CoinMarketCapKey);
    return CoinMarketCapKey;
}());
exports.CoinMarketCapKey = CoinMarketCapKey;
//# sourceMappingURL=CoinMarketCapKey.js.map