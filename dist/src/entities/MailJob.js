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
exports.MailJob = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var MailJob = (function () {
    function MailJob() {
    }
    MailJob.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    MailJob.prototype.updateUpdateDates = function () {
        this.updatedAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], MailJob.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'sender_name', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "senderName", void 0);
    __decorate([
        typeorm_1.Column({ name: 'sender_address', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "senderAddress", void 0);
    __decorate([
        typeorm_1.Column({ name: 'recipient_address', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "recipientAddress", void 0);
    __decorate([
        typeorm_1.Column({ name: 'title', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "title", void 0);
    __decorate([
        typeorm_1.Column({ name: 'template_name', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "templateName", void 0);
    __decorate([
        typeorm_1.Column({ name: 'content', type: 'text' }),
        __metadata("design:type", String)
    ], MailJob.prototype, "content", void 0);
    __decorate([
        typeorm_1.Column({ name: 'is_sent', type: 'bool' }),
        __metadata("design:type", Boolean)
    ], MailJob.prototype, "isSent", void 0);
    __decorate([
        typeorm_1.Column({ name: 'retry_count', type: 'integer' }),
        __metadata("design:type", Number)
    ], MailJob.prototype, "retryCount", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], MailJob.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column({ name: 'updated_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], MailJob.prototype, "updatedAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], MailJob.prototype, "updateCreateDates", null);
    __decorate([
        typeorm_1.BeforeUpdate(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], MailJob.prototype, "updateUpdateDates", null);
    MailJob = __decorate([
        typeorm_1.Entity('mail_job')
    ], MailJob);
    return MailJob;
}());
exports.MailJob = MailJob;
//# sourceMappingURL=MailJob.js.map