import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RatingsModule } from './ratings/ratings.module';
import { AchievementsModule } from './achievements/achievements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { StadiumsModule } from './stadiums/stadiums.module';
import { BookingsModule } from './bookings/bookings.module';
import { LocationsModule } from './locations/locations.module';
import { FilesModule } from './files/files.module';
import { TeamsModule } from './teams/teams.module';
import { ChallengesModule } from './challenges/challenges.module';
import { GamesModule } from './games/games.module';
import { SupportModule } from './support/support.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { GameReminderModule } from './game-reminder/game-reminder.module';
import { AnalyticsController } from './analytics/analytics.controller';

import { User } from './users/entities/user.entity';
import { Transaction } from './users/entities/transaction.entity';
import { Friendship } from './users/entities/friendship.entity';
import { Achievement } from './achievements/entities/achievement.entity';
import { PlayerRating } from './ratings/entities/rating.entity';
import { GameMvpVote } from './ratings/entities/game-mvp-vote.entity';
import { GameMvpAward } from './ratings/entities/game-mvp-award.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Stadium } from './stadiums/entities/stadium.entity';
import { Booking } from './bookings/entities/booking.entity';
import { District } from './locations/entities/district.entity';
import { MetroStation } from './locations/entities/metro-station.entity';
import { Team } from './teams/entities/team.entity';
import { TeamJoinRequest } from './teams/entities/team-join-request.entity';
import { Challenge } from './challenges/entities/challenge.entity';
import { SupportTicket } from './support/entities/support-ticket.entity';
import { Game } from './games/entities/game.entity';
import { GamePlayerStats } from './games/entities/game-player-stats.entity';
import { ChatMessage } from './games/entities/chat-message.entity';
import { NoShow } from './games/entities/no-show.entity';
import { PlayerReport } from './games/entities/player-report.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host:     configService.get<string>('REDIS_HOST', 'localhost'),
                    port:     configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                },
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres' as const,
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
                username: configService.get<string>('DB_USERNAME', 'postgres'),
                password: configService.get<string>('DB_PASSWORD', 'password'),
                database: configService.get<string>('DB_DATABASE', 'football_db'),
                entities: [
                    User, Transaction, Friendship,
                    Achievement,
                    PlayerRating, GameMvpVote, GameMvpAward,
                    Notification,
                    Stadium, Booking,
                    District, MetroStation,
                    Team, TeamJoinRequest,
                    Challenge,
                    Game, GamePlayerStats, ChatMessage, NoShow, PlayerReport,
                    SupportTicket,
                ],
                synchronize: true,
                retryAttempts: 10,
                retryDelay: 3000,
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        RatingsModule,
        AchievementsModule,
        NotificationsModule,
        PaymentsModule,
        StadiumsModule,
        BookingsModule,
        LocationsModule,
        FilesModule,
        TeamsModule,
        ChallengesModule,
        GamesModule,
        SupportModule,
        TelegramBotModule,
        GameReminderModule,
    ],
    controllers: [AnalyticsController],
})
export class AppModule {}
