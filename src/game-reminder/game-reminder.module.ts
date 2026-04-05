import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GAME_REMINDER_QUEUE } from './game-reminder.constants';
import { GameReminderProducer } from './game-reminder.producer';
import { GameReminderProcessor } from './game-reminder.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { Game } from '../games/entities/game.entity';

@Module({
    imports: [
        BullModule.registerQueueAsync({
            name: GAME_REMINDER_QUEUE,
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host:     configService.get<string>('REDIS_HOST', 'localhost'),
                    port:     configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD') || undefined,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 10_000 },
                },
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([Game]),
        NotificationsModule,
    ],
    providers: [GameReminderProducer, GameReminderProcessor],
    exports:   [GameReminderProducer],
})
export class GameReminderModule {}
