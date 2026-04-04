import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { StadiumsModule } from '../stadiums/stadiums.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [StadiumsModule, UsersModule],
    controllers: [FilesController],
    providers: [MinioService, FilesService],
    exports: [FilesService, MinioService],
})
export class FilesModule {}
