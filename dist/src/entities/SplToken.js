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
exports.SplToken = void 0;
var typeorm_1 = require("typeorm");
var SplToken = (function () {
    function SplToken() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'symbol', nullable: false }),
        __metadata("design:type", String)
    ], SplToken.prototype, "symbol", void 0);
    __decorate([
        typeorm_1.Column({ name: 'name', nullable: false }),
        __metadata("design:type", String)
    ], SplToken.prototype, "name", void 0);
    __decorate([
        typeorm_1.Column({ name: 'program_id', nullable: false }),
        __metadata("design:type", String)
    ], SplToken.prototype, "programId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'decimal', nullable: false }),
        __metadata("design:type", Number)
    ], SplToken.prototype, "decimal", void 0);
    __decorate([
        typeorm_1.Column({ name: 'total_supply', nullable: false }),
        __metadata("design:type", String)
    ], SplToken.prototype, "totalSupple", void 0);
    __decorate([
        typeorm_1.Column({ name: 'network', nullable: false }),
        __metadata("design:type", String)
    ], SplToken.prototype, "network", void 0);
    SplToken = __decorate([
        typeorm_1.Entity('spl_token')
    ], SplToken);
    return SplToken;
}());
exports.SplToken = SplToken;
//# sourceMappingURL=SplToken.js.map