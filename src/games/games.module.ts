import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Game } from './entities/game.entity';
import { GamePlayerStats } from './entities/game-player-stats.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { NoShow } from './entities/no-show.entity';
import { PlayerReport } from './entities/player-report.entity';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { GamesGateway } from './games.gateway';
import { HotNotificationsCron } from './hot-notifications.cron';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { StadiumsModule } from '../stadiums/stadiums.module';
import { BookingsModule } from '../bookings/bookings.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { RatingsModule } from '../ratings/ratings.module';
import { GameReminderModule } from '../game-reminder/game-reminder.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Game, GamePlayerStats, ChatMessage, NoShow, PlayerReport]),
        ScheduleModule.forRoot(),
        TeamsModule,
        UsersModule,
        NotificationsModule,
        PaymentsModule,
        forwardRef(() => StadiumsModule),
        BookingsModule,
        AchievementsModule,
        RatingsModule,
        GameReminderModule,
    ],
    controllers: [GamesController],
    providers: [GamesService, GamesGateway, HotNotificationsCron],
    exports: [GamesService],
})
export class GamesModule {}
