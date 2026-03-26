import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { District } from './entities/district.entity';
import { MetroStation } from './entities/metro-station.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([District, MetroStation])],
    controllers: [LocationsController],
    providers: [LocationsService],
    exports: [LocationsService],
})
export class LocationsModule {}
