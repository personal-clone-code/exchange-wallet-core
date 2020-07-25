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
exports.MailLog = void 0;
var typeorm_1 = require("typeorm");
var sota_common_1 = require("sota-common");
var Enums_1 = require("../Enums");
var MailLog = (function () {
    function MailLog() {
    }
    MailLog.prototype.updateCreateDates = function () {
        this.createdAt = sota_common_1.Utils.nowInMillis();
    };
    __decorate([
        typeorm_1.PrimaryGeneratedColumn(),
        __metadata("design:type", Number)
    ], MailLog.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column({ name: 'job_id', type: 'integer' }),
        __metadata("design:type", Number)
    ], MailLog.prototype, "jobId", void 0);
    __decorate([
        typeorm_1.Column({ name: 'status', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailLog.prototype, "status", void 0);
    __decorate([
        typeorm_1.Column({ name: 'msg', type: 'varchar' }),
        __metadata("design:type", String)
    ], MailLog.prototype, "msg", void 0);
    __decorate([
        typeorm_1.Column({ name: 'created_at', type: 'bigint' }),
        __metadata("design:type", Number)
    ], MailLog.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.BeforeInsert(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], MailLog.prototype, "updateCreateDates", null);
    MailLog = __decorate([
        typeorm_1.Entity('mail_log')
    ], MailLog);
    return MailLog;
}());
exports.MailLog = MailLog;
//# sourceMappingURL=MailLog.js.map