import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
    controllers: [FilesController],
    providers: [MinioService, FilesService],
    exports: [FilesService, MinioService],
})
export class FilesModule {}
