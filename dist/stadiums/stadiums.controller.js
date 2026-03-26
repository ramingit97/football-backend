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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StadiumsController = void 0;
const common_1 = require("@nestjs/common");
const stadiums_service_1 = require("./stadiums.service");
const create_stadium_dto_1 = require("./dto/create-stadium.dto");
let StadiumsController = class StadiumsController {
    constructor(stadiumsService) {
        this.stadiumsService = stadiumsService;
    }
    create(createStadiumDto) {
        return this.stadiumsService.create(createStadiumDto);
    }
    findAll() {
        return this.stadiumsService.findAll();
    }
    findAllAdmin() {
        return this.stadiumsService.findAllAdmin();
    }
    findPending() {
        return this.stadiumsService.findPending();
    }
    getStats() {
        return this.stadiumsService.getStats();
    }
    approve(id, adminId) {
        return this.stadiumsService.approve(id, adminId || 'admin');
    }
    reject(id, reason) {
        return this.stadiumsService.reject(id, reason);
    }
    suspend(id) {
        return this.stadiumsService.suspend(id);
    }
    findOne(id) {
        return this.stadiumsService.findOne(id);
    }
    findByOwner(ownerId) {
        return this.stadiumsService.findByOwner(ownerId);
    }
    update(id, updateData) {
        return this.stadiumsService.update(id, updateData);
    }
    delete(id) {
        return this.stadiumsService.delete(id);
    }
    getAvailableSlots(id, date) {
        return this.stadiumsService.getAvailableSlots(id, date);
    }
};
exports.StadiumsController = StadiumsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stadium_dto_1.CreateStadiumDto]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('admin/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('adminId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "suspend", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('owner/:ownerId'),
    __param(0, (0, common_1.Param)('ownerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "findByOwner", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/available-slots'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StadiumsController.prototype, "getAvailableSlots", null);
exports.StadiumsController = StadiumsController = __decorate([
    (0, common_1.Controller)('stadiums'),
    __metadata("design:paramtypes", [stadiums_service_1.StadiumsService])
], StadiumsController);
//# sourceMappingURL=stadiums.controller.js.map