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
exports.KmsDataKey = void 0;
var sota_common_1 = require("sota-common");
var typeorm_1 = require("typeorm");
var KmsDataKey = (function () {
    function KmsDataKey() {
    }
    KmsDataKey.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    KmsDataKey.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn({ type: 'bigint' }),
        __metadata("design:type", Number)
    ], KmsDataKey.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'cmk_id', nullable: false }),
        __metadata("design:type", String)
    ], KmsDataKey.prototype, "cmkId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'encrypted_data_key', nullable: false }),
        __metadata("design:type", String)
    ], KmsDataKey.prototype, "encryptedDataKey", void 0);
    __decorate([
        typeorm_1.Column({ type: 'tinyint', name: 'is_enabled', nullable: false }),
        __metadata("design:type", Number)
    ], KmsDataKey.prototype, "isEnabled", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], KmsDataKey.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], KmsDataKey.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], KmsDataKey.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], KmsDataKey.prototype, "updateUpdateDates", null);
    KmsDataKey = __decorate([
        typeorm_1.Entity('kms_data_key')
    ], KmsDataKey);
    return KmsDataKey;
}());
exports.KmsDataKey = KmsDataKey;
//# sourceMappingURL=KmsDataKey.js.map