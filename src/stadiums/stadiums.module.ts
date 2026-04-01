import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stadium } from './entities/stadium.entity';
import { StadiumsService } from './stadiums.service';
import { StadiumsController } from './stadiums.controller';
import { TelegramService } from './telegram.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Stadium]),
        forwardRef(() => BookingsModule),
    ],
    controllers: [StadiumsController],
    providers: [StadiumsService, TelegramService],
    exports: [StadiumsService],
})
export class StadiumsModule {}
