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
var Setting = (function () {
    function Setting() {
    }
    __decorate([
        typeorm_1.PrimaryColumn({ name: 'key', type: 'varchar', length: 255, nullable: false }),
        __metadata("design:type", String)
    ], Setting.prototype, "key", void 0);
    __decorate([
        typeorm_1.Column({ name: 'value', type: 'varchar', length: '255', nullable: false }),
        __metadata("design:type", String)
    ], Setting.prototype, "value", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], Setting.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint', nullable: true }),
        __metadata("design:type", Number)
    ], Setting.prototype, "updated_at", void 0);
    Setting = __decorate([
        typeorm_1.Entity('setting')
    ], Setting);
    return Setting;
}());
exports.Setting = Setting;
//# sourceMappingURL=Setting.js.map