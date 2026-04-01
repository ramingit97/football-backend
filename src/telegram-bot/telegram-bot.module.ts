import { Module } from '@nestjs/common';
import { TelegramBotController } from './telegram-bot.controller';
import { StadiumsModule } from '../stadiums/stadiums.module';
import { SupportModule } from '../support/support.module';
import { UsersModule } from '../users/users.module';
import { GamesModule } from '../games/games.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        StadiumsModule,
        SupportModule,
        UsersModule,
        GamesModule,
        NotificationsModule,
    ],
    controllers: [TelegramBotController],
})
export class TelegramBotModule {}
