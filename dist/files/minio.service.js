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
exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const Minio = require("minio");
let MinioService = class MinioService {
    constructor() {
        this.endPoint = process.env.MINIO_ENDPOINT || 'localhost';
        this.port = parseInt(process.env.MINIO_PORT || '9000');
        this.accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
        this.secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
        this.bucketName = process.env.MINIO_BUCKET || 'football-files';
        this.useSSL = process.env.MINIO_USE_SSL === 'true';
        this.client = new Minio.Client({
            endPoint: this.endPoint,
            port: this.port,
            useSSL: this.useSSL,
            accessKey: this.accessKey,
            secretKey: this.secretKey,
        });
    }
    async onModuleInit() {
        await this.ensureBucketExists();
    }
    async ensureBucketExists() {
        try {
            const exists = await this.client.bucketExists(this.bucketName);
            if (!exists) {
                await this.client.makeBucket(this.bucketName, 'us-east-1');
                console.log(`Bucket '${this.bucketName}' created successfully`);
                const policy = {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { AWS: ['*'] },
                            Action: ['s3:GetObject'],
                            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                        },
                    ],
                };
                await this.client.setBucketPolicy(this.bucketName, JSON.stringify(policy));
            }
        }
        catch (error) {
            console.error('Error ensuring bucket exists:', error.message);
        }
    }
    async uploadFile(file, folder = 'uploads') {
        const ext = file.originalname.split('.').pop();
        const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        await this.client.putObject(this.bucketName, key, file.buffer, file.size, { 'Content-Type': file.mimetype });
        const url = `http://${this.endPoint}:${this.port}/${this.bucketName}/${key}`;
        return { url, key };
    }
    async uploadMultipleFiles(files, folder = 'uploads') {
        const results = await Promise.all(files.map(file => this.uploadFile(file, folder)));
        return results;
    }
    async deleteFile(key) {
        await this.client.removeObject(this.bucketName, key);
    }
    async getPresignedUrl(key, expirySeconds = 3600) {
        return this.client.presignedGetObject(this.bucketName, key, expirySeconds);
    }
    getPublicUrl(key) {
        return `http://${this.endPoint}:${this.port}/${this.bucketName}/${key}`;
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MinioService);
//# sourceMappingURL=minio.service.js.map