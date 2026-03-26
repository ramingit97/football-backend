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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async uploadStadiumImage(stadiumId, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.filesService.uploadStadiumImage(file, stadiumId);
    }
    async uploadMultipleStadiumImages(stadiumId, files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files uploaded');
        }
        return this.filesService.uploadMultipleStadiumImages(files, stadiumId);
    }
    async uploadAvatar(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.filesService.uploadUserAvatar(file, userId);
    }
    async uploadTeamFlag(teamId, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.filesService.uploadTeamFlag(file, teamId);
    }
    async deleteFile(key) {
        if (!key) {
            throw new common_1.BadRequestException('File key is required');
        }
        await this.filesService.deleteFile(key);
        return { success: true, message: 'File deleted' };
    }
    health() {
        return { status: 'ok', service: 'file-service' };
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('stadium/:stadiumId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('stadiumId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadStadiumImage", null);
__decorate([
    (0, common_1.Post)('stadium/:stadiumId/multiple'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10, {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('stadiumId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadMultipleStadiumImages", null);
__decorate([
    (0, common_1.Post)('avatar/:userId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('team/:teamId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.Param)('teamId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "uploadTeamFlag", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "health", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map