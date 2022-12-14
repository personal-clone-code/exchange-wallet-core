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
exports.WebhookProgress = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var WebhookProgress = (function () {
    function WebhookProgress() {
    }
    WebhookProgress.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    WebhookProgress.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'webhook_id', nullable: false }),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "webhookId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'type', nullable: false }),
        __metadata("design:type", String)
    ], WebhookProgress.prototype, "type", void 0);
    __decorate([
        typeorm_1.Column({ name: 'ref_id', nullable: false }),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "refId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'event', nullable: false }),
        __metadata("design:type", String)
    ], WebhookProgress.prototype, "event", void 0);
    __decorate([
        typeorm_1.Column({ name: 'is_processed' }),
        __metadata("design:type", Boolean)
    ], WebhookProgress.prototype, "isProcessed", void 0);
    __decorate([
        typeorm_1.Column({ name: 'retry_count', type: 'int', nullable: false }),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "retryCount", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WebhookProgress.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WebhookProgress.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WebhookProgress.prototype, "updateUpdateDates", null);
    WebhookProgress = __decorate([
        typeorm_1.Entity('webhook_progress')
    ], WebhookProgress);
    return WebhookProgress;
}());
exports.WebhookProgress = WebhookProgress;
//# sourceMappingURL=WebhookProgress.js.map