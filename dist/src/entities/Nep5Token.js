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
var Nep5Token = (function () {
    function Nep5Token() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'symbol', nullable: false }),
        __metadata("design:type", String)
    ], Nep5Token.prototype, "symbol", void 0);
    __decorate([
        typeorm_1.Column({ name: 'name', nullable: false }),
        __metadata("design:type", String)
    ], Nep5Token.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column({ name: 'script_hash', nullable: false }),
        __metadata("design:type", String)
    ], Nep5Token.prototype, "scriptHash", void 0);
    __decorate([
        typeorm_1.Column({ name: 'decimal', nullable: false }),
        __metadata("design:type", Number)
    ], Nep5Token.prototype, "decimal", void 0);
    __decorate([
        typeorm_1.Column({ name: 'network', nullable: false }),
        __metadata("design:type", String)
    ], Nep5Token.prototype, "network", void 0);
    __decorate([
        typeorm_1.Column({ name: 'total_supply', nullable: false }),
        __metadata("design:type", String)
    ], Nep5Token.prototype, "totalSupply", void 0);
    Nep5Token = __decorate([
        typeorm_1.Entity('nep5_token')
    ], Nep5Token);
    return Nep5Token;
}());
exports.Nep5Token = Nep5Token;
//# sourceMappingURL=Nep5Token.js.map