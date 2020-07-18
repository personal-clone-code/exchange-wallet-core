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
exports.EosToken = void 0;
var typeorm_1 = require("typeorm");
var EosToken = (function () {
    function EosToken() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'symbol', nullable: false }),
        __metadata("design:type", String)
    ], EosToken.prototype, "symbol", void 0);
    __decorate([
        typeorm_1.Column({ name: 'code', nullable: false }),
        __metadata("design:type", String)
    ], EosToken.prototype, "code", void 0);
    __decorate([
        typeorm_1.Column({ name: 'scale', nullable: false }),
        __metadata("design:type", Number)
    ], EosToken.prototype, "scale", void 0);
    __decorate([
        typeorm_1.Column({ name: 'network', nullable: false }),
        __metadata("design:type", String)
    ], EosToken.prototype, "network", void 0);
    EosToken = __decorate([
        typeorm_1.Entity('eos_token')
    ], EosToken);
    return EosToken;
}());
exports.EosToken = EosToken;
//# sourceMappingURL=EosToken.js.map