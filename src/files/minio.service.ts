import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
    private client: Minio.Client;

    private readonly endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    private readonly port = parseInt(process.env.MINIO_PORT || '9000');
    private readonly accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    private readonly secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin123';
    private readonly bucketName = process.env.MINIO_BUCKET || 'football-files';
    private readonly useSSL = process.env.MINIO_USE_SSL === 'true';
    private readonly publicUrl = process.env.MINIO_PUBLIC_URL || null;

    constructor() {
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

    private async ensureBucketExists(): Promise<void> {
        try {
            const exists = await this.client.bucketExists(this.bucketName);
            if (!exists) {
                await this.client.makeBucket(this.bucketName, 'us-east-1');
                console.log(`Bucket '${this.bucketName}' created successfully`);

                // Set bucket policy to public read
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
        } catch (error) {
            console.error('Error ensuring bucket exists:', error.message);
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'uploads',
    ): Promise<{ url: string; key: string }> {
        const ext = file.originalname.split('.').pop();
        const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        await this.client.putObject(
            this.bucketName,
            key,
            file.buffer,
            file.size,
            { 'Content-Type': file.mimetype },
        );

        const url = this.publicUrl
            ? `${this.publicUrl}/${key}`
            : `http://${this.endPoint}:${this.port}/${this.bucketName}/${key}`;

        return { url, key };
    }

    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder: string = 'uploads',
    ): Promise<{ url: string; key: string }[]> {
        const results = await Promise.all(
            files.map(file => this.uploadFile(file, folder)),
        );
        return results;
    }

    async deleteFile(key: string): Promise<void> {
        await this.client.removeObject(this.bucketName, key);
    }

    async getPresignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
        return this.client.presignedGetObject(this.bucketName, key, expirySeconds);
    }

    getPublicUrl(key: string): string {
        return this.publicUrl
            ? `${this.publicUrl}/${key}`
            : `http://${this.endPoint}:${this.port}/${this.bucketName}/${key}`;
    }
}
