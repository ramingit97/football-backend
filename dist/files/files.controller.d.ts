import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadStadiumImage(stadiumId: string, file: Express.Multer.File): Promise<import("./files.service").UploadResult>;
    uploadMultipleStadiumImages(stadiumId: string, files: Express.Multer.File[]): Promise<import("./files.service").UploadResult[]>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<import("./files.service").UploadResult>;
    uploadTeamFlag(teamId: string, file: Express.Multer.File): Promise<import("./files.service").UploadResult>;
    deleteFile(key: string): Promise<{
        success: boolean;
        message: string;
    }>;
    health(): {
        status: string;
        service: string;
    };
}
