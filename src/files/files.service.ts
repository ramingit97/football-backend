import { Injectable } from '@nestjs/common';
import { MinioService } from './minio.service';

export interface UploadResult {
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimetype: string;
}

@Injectable()
export class FilesService {
    constructor(private readonly minioService: MinioService) { }

    async uploadStadiumImage(file: Express.Multer.File, stadiumId: string): Promise<UploadResult> {
        const result = await this.minioService.uploadFile(file, `stadiums/${stadiumId}`);
        return {
            ...result,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    async uploadUserAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult> {
        const result = await this.minioService.uploadFile(file, `avatars/${userId}`);
        return {
            ...result,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    async uploadTeamFlag(file: Express.Multer.File, teamId: string): Promise<UploadResult> {
        const result = await this.minioService.uploadFile(file, `teams/${teamId}`);
        return {
            ...result,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    }

    async uploadMultipleStadiumImages(
        files: Express.Multer.File[],
        stadiumId: string,
    ): Promise<UploadResult[]> {
        const results = await Promise.all(
            files.map(file => this.uploadStadiumImage(file, stadiumId)),
        );
        return results;
    }

    async deleteFile(key: string): Promise<void> {
        await this.minioService.deleteFile(key);
    }
}
