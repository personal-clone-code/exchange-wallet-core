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
var WebhookLog = (function () {
    function WebhookLog() {
    }
    WebhookLog.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], WebhookLog.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'webhook_progress_id', nullable: false }),
        __metadata("design:type", Number)
    ], WebhookLog.prototype, "progressId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'url', nullable: false }),
        __metadata("design:type", String)
    ], WebhookLog.prototype, "url", void 0);
    __decorate([
        typeorm_1.Column({ name: 'params', nullable: false }),
        __metadata("design:type", String)
    ], WebhookLog.prototype, "params", void 0);
    __decorate([
        typeorm_1.Column({ name: 'status', nullable: false }),
        __metadata("design:type", Number)
    ], WebhookLog.prototype, "status", void 0);
    __decorate([
        typeorm_1.Column({ name: 'msg' }),
        __metadata("design:type", String)
    ], WebhookLog.prototype, "msg", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], WebhookLog.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], WebhookLog.prototype, "updateCreateDates", null);
    WebhookLog = __decorate([
        typeorm_1.Entity('webhook_log')
    ], WebhookLog);
    return WebhookLog;
}());
exports.WebhookLog = WebhookLog;
//# sourceMappingURL=WebhookLog.js.map