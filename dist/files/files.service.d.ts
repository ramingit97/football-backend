import { MinioService } from './minio.service';
export interface UploadResult {
    url: string;
    key: string;
    originalName: string;
    size: number;
    mimetype: string;
}
export declare class FilesService {
    private readonly minioService;
    constructor(minioService: MinioService);
    uploadStadiumImage(file: Express.Multer.File, stadiumId: string): Promise<UploadResult>;
    uploadUserAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult>;
    uploadTeamFlag(file: Express.Multer.File, teamId: string): Promise<UploadResult>;
    uploadMultipleStadiumImages(files: Express.Multer.File[], stadiumId: string): Promise<UploadResult[]>;
    deleteFile(key: string): Promise<void>;
}
