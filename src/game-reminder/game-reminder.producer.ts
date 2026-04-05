import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GAME_REMINDER_QUEUE, GAME_REMINDER_JOB } from './game-reminder.constants';

export interface GameReminderPayload {
    gameId: string;
}

@Injectable()
export class GameReminderProducer {
    private readonly logger = new Logger(GameReminderProducer.name);

    constructor(
        @InjectQueue(GAME_REMINDER_QUEUE) private readonly queue: Queue,
    ) {}

    /**
     * Планирует напоминание за 1 час до начала игры.
     * jobId = gameId — гарантирует уникальность и позволяет удалить job при отмене.
     */
    async scheduleReminder(gameId: string, gameDate: string, gameTime: string): Promise<void> {
        const gameDateTime = new Date(`${gameDate}T${gameTime}:00`);
        const remindAt     = new Date(gameDateTime.getTime() - 60 * 60 * 1000);
        const delay        = remindAt.getTime() - Date.now();

        if (delay <= 0) {
            this.logger.warn(`Game ${gameId} starts in less than 1h — skipping reminder`);
            return;
        }

        await this.queue.add(GAME_REMINDER_JOB, { gameId }, {
            jobId: gameId,
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 10_000 },
            removeOnComplete: true,
            removeOnFail:     false,
        });

        this.logger.log(
            `Reminder scheduled for game ${gameId} ` +
            `at ${remindAt.toISOString()} (delay ${Math.round(delay / 60000)} min)`,
        );
    }

    /**
     * Удаляет запланированное напоминание (например, при отмене игры).
     */
    async cancelReminder(gameId: string): Promise<void> {
        const job = await this.queue.getJob(gameId);
        if (job) {
            await job.remove();
            this.logger.log(`Reminder cancelled for game ${gameId}`);
        }
    }
}
