import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { GAME_REMINDER_QUEUE, GAME_REMINDER_JOB } from './game-reminder.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { Game } from '../games/entities/game.entity';

@Processor(GAME_REMINDER_QUEUE)
export class GameReminderProcessor extends WorkerHost {
    private readonly logger = new Logger(GameReminderProcessor.name);

    constructor(
        @InjectRepository(Game)
        private readonly gamesRepository: Repository<Game>,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    private async sendTelegram(text: string): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!token || !chatId) return;
        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
            });
        } catch (e) {
            this.logger.warn(`Telegram send failed: ${e.message}`);
        }
    }

    async process(job: Job<{ gameId: string }>): Promise<void> {
        if (job.name !== GAME_REMINDER_JOB) return;

        const { gameId } = job.data;

        const game = await this.gamesRepository.findOne({ where: { id: gameId as any } });
        if (!game) {
            this.logger.warn(`Game ${gameId} not found — skipping reminder`);
            return;
        }
        if (game.status === 'cancelled' || game.status === 'finished') {
            this.logger.log(`Game ${gameId} is ${game.status} — skipping reminder`);
            return;
        }

        const players: { id: string }[] = game.players || [];
        if (players.length === 0) {
            this.logger.warn(`Game ${gameId} has no players — skipping reminder`);
            return;
        }

        const title   = '⚽ Oyununuz başlamaq üzrədir!';
        const message = `${game.title} — 1 saat sonra başlayır. Hazır olun! 🏃`;

        // Push + in-app каждому актуальному игроку
        await Promise.all(
            players.map(p =>
                this.notificationsService
                    .sendNotification(p.id, 'GAME_REMINDER', title, message, undefined, { gameId })
                    .catch(e => this.logger.warn(`Notif failed for player ${p.id}: ${e.message}`)),
            ),
        );

        // Telegram в support-чат
        const spotsLeft = game.maxPlayers - players.length;
        const dateStr   = new Date(game.date as any).toISOString().slice(0, 10);
        const text = [
            `⚽ <b>Oyun xatırlatması göndərildi</b>`,
            ``,
            `📋 <b>${game.title}</b>`,
            `📅 ${dateStr} · 🕐 ${game.time}`,
            `🏟️ ${game.location}`,
            `👥 ${players.length} / ${game.maxPlayers} oyunçu${spotsLeft > 0 ? ` · ${spotsLeft} yer boş` : ' · Dolu'}`,
            ``,
            `✅ ${players.length} oyunçuya push bildiriş göndərildi.`,
        ].join('\n');

        this.sendTelegram(text).catch(() => {});

        this.logger.log(`Reminders sent for game "${game.title}" (${players.length} players)`);
    }
}
