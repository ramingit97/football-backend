import {
    Controller,
    Post,
    Delete,
    Get,
    Param,
    Query,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { TelegramService } from '../stadiums/telegram.service';
import { UsersService } from '../users/users.service';

@Controller('files')
export class FilesController {
    constructor(
        private readonly filesService: FilesService,
        private readonly telegramService: TelegramService,
        private readonly usersService: UsersService,
    ) { }

    // Upload single stadium image
    @Post('stadium/:stadiumId')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    }))
    async uploadStadiumImage(
        @Param('stadiumId') stadiumId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.filesService.uploadStadiumImage(file, stadiumId);
    }

    // Upload multiple stadium images
    @Post('stadium/:stadiumId/multiple')
    @UseInterceptors(FilesInterceptor('files', 10, {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    }))
    async uploadMultipleStadiumImages(
        @Param('stadiumId') stadiumId: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded');
        }
        return this.filesService.uploadMultipleStadiumImages(files, stadiumId);
    }

    // Upload user avatar
    @Post('avatar/:userId')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    }))
    async uploadAvatar(
        @Param('userId') userId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        const result = await this.filesService.uploadUserAvatar(file, userId);
        // Notify admin for moderation — fetch user info for context (fire-and-forget)
        this.usersService.findOneById(userId).then(user => {
            this.telegramService.sendAvatarUpload(
                { id: userId, name: user?.name, email: user?.email },
                result.url,
            ).catch(() => {});
        }).catch(() => {});
        return result;
    }

    // Upload team flag
    @Post('team/:teamId')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for team flags
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                cb(new BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    }))
    async uploadTeamFlag(
        @Param('teamId') teamId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return this.filesService.uploadTeamFlag(file, teamId);
    }

    // Delete file by key
    @Delete()
    async deleteFile(@Query('key') key: string) {
        if (!key) {
            throw new BadRequestException('File key is required');
        }
        await this.filesService.deleteFile(key);
        return { success: true, message: 'File deleted' };
    }

    // Health check
    @Get('health')
    health() {
        return { status: 'ok', service: 'file-service' };
    }
}
