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
exports.XDeposit = void 0;
var typeorm_1 = require("typeorm");
var XDeposit = (function () {
    function XDeposit() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'deposit_id', nullable: false }),
        __metadata("design:type", Number)
    ], XDeposit.prototype, "depositId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_hash', nullable: false }),
        __metadata("design:type", String)
    ], XDeposit.prototype, "blockHash", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_number', nullable: false }),
        __metadata("design:type", Number)
    ], XDeposit.prototype, "blockNumber", void 0);
    __decorate([
        typeorm_1.Column({ name: 'block_timestamp', nullable: false }),
        __metadata("design:type", Number)
    ], XDeposit.prototype, "blockTimestamp", void 0);
    return XDeposit;
}());
exports.XDeposit = XDeposit;
//# sourceMappingURL=XDeposit.js.map