import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stadium } from './entities/stadium.entity';
import { StadiumsService } from './stadiums.service';
import { StadiumsController } from './stadiums.controller';
import { TelegramService } from './telegram.service';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Stadium]),
        forwardRef(() => BookingsModule),
        forwardRef(() => UsersModule),
        forwardRef(() => GamesModule),
        NotificationsModule,
    ],
    controllers: [StadiumsController],
    providers: [StadiumsService, TelegramService],
    exports: [StadiumsService, TelegramService],
})
export class StadiumsModule {}
