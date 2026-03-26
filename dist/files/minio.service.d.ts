import { OnModuleInit } from '@nestjs/common';
export declare class MinioService implements OnModuleInit {
    private client;
    private readonly endPoint;
    private readonly port;
    private readonly accessKey;
    private readonly secretKey;
    private readonly bucketName;
    private readonly useSSL;
    constructor();
    onModuleInit(): Promise<void>;
    private ensureBucketExists;
    uploadFile(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        key: string;
    }>;
    uploadMultipleFiles(files: Express.Multer.File[], folder?: string): Promise<{
        url: string;
        key: string;
    }[]>;
    deleteFile(key: string): Promise<void>;
    getPresignedUrl(key: string, expirySeconds?: number): Promise<string>;
    getPublicUrl(key: string): string;
}
