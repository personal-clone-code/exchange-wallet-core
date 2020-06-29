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
var Trc20Token = (function () {
    function Trc20Token() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'symbol', nullable: false }),
        __metadata("design:type", String)
    ], Trc20Token.prototype, "symbol", void 0);
    __decorate([
        typeorm_1.Column({ name: 'name', nullable: false }),
        __metadata("design:type", String)
    ], Trc20Token.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column({ name: 'contract_address', nullable: false }),
        __metadata("design:type", String)
    ], Trc20Token.prototype, "contractAddress", void 0);
    __decorate([
        typeorm_1.Column({ name: 'decimal', nullable: false }),
        __metadata("design:type", Number)
    ], Trc20Token.prototype, "decimal", void 0);
    __decorate([
        typeorm_1.Column({ name: 'total_supply', nullable: false }),
        __metadata("design:type", String)
    ], Trc20Token.prototype, "totalSupple", void 0);
    __decorate([
        typeorm_1.Column({ name: 'network', nullable: false }),
        __metadata("design:type", String)
    ], Trc20Token.prototype, "network", void 0);
    Trc20Token = __decorate([
        typeorm_1.Entity('trc20_token')
    ], Trc20Token);
    return Trc20Token;
}());
exports.Trc20Token = Trc20Token;
//# sourceMappingURL=Trc20Token.js.map