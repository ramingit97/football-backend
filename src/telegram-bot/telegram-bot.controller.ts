import { Controller, Post, Body, Logger } from '@nestjs/common';
import { TelegramService } from '../stadiums/telegram.service';
import { StadiumsService } from '../stadiums/stadiums.service';
import { SupportService } from '../support/support.service';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('telegram')
export class TelegramBotController {
    private readonly logger = new Logger(TelegramBotController.name);

    constructor(
        private readonly telegramService: TelegramService,
        private readonly stadiumsService: StadiumsService,
        private readonly supportService: SupportService,
        private readonly usersService: UsersService,
        private readonly gamesService: GamesService,
        private readonly notificationsService: NotificationsService,
    ) {}

    @Post('webhook')
    async handleWebhook(@Body() body: any) {
        // ── Callback query (inline button press) ─────────────
        const cb = body?.callback_query;
        if (cb) {
            const data: string = cb.data || '';
            const [action, id] = data.split('_');
            if (!id) { await this.telegramService.answerCallback(cb.id, '❓'); return { ok: true }; }

            if (action === 'approve') {
                await this.stadiumsService.approve(id, 'telegram-admin');
                await this.telegramService.answerCallback(cb.id, '✅ Təsdiq edildi!');
                await this.telegramService.editMessage(cb.message.chat.id, cb.message.message_id,
                    `${cb.message.text}\n\n✅ <b>TƏSDİQ EDİLDİ</b>`);
            } else if (action === 'reject') {
                await this.stadiumsService.reject(id, 'Telegram vasitəsilə rədd edildi');
                await this.telegramService.answerCallback(cb.id, '❌ Rədd edildi');
                await this.telegramService.editMessage(cb.message.chat.id, cb.message.message_id,
                    `${cb.message.text}\n\n❌ <b>RƏD EDİLDİ</b>`);
            }
            return { ok: true };
        }

        // ── Text message (admin commands) ─────────────────────
        const msg = body?.message;
        if (!msg?.text) return { ok: true };

        const chatId = msg.chat.id;
        const text: string = msg.text.trim();

        try {
            // /reply TICKET_ID response text
            if (text.startsWith('/reply ')) {
                const parts = text.slice(7).split(' ');
                const ticketId = parts[0];
                const replyText = parts.slice(1).join(' ');
                if (!ticketId || !replyText) {
                    await this.telegramService.sendMessage(chatId, '⚠️ Format: /reply TICKET_ID mətn');
                    return { ok: true };
                }
                const ticket = await this.supportService.reply(ticketId, replyText);
                // Push notification to user
                await this.notificationsService.sendNotification(
                    ticket.userId, 'SUPPORT_REPLY',
                    '💬 Dəstək cavabı',
                    replyText,
                    undefined,
                    { ticketId: ticket.id },
                );
                await this.telegramService.sendMessage(chatId, `✅ Cavab göndərildi: <i>${replyText}</i>`);
                return { ok: true };
            }

            // /tickets — open support tickets
            if (text === '/tickets') {
                const tickets = await this.supportService.findOpen();
                if (!tickets.length) {
                    await this.telegramService.sendMessage(chatId, '✅ Açıq tiket yoxdur');
                    return { ok: true };
                }
                const lines = tickets.map((t, i) =>
                    `${i + 1}. <b>${t.userName}</b> [<code>${t.id.slice(0, 8)}</code>]\n${t.message.slice(0, 100)}${t.message.length > 100 ? '...' : ''}`
                ).join('\n\n');
                await this.telegramService.sendMessage(chatId, `💬 <b>Açıq tikerlər (${tickets.length}):</b>\n\n${lines}`);
                return { ok: true };
            }

            // /addbalance email|phone amount
            if (text.startsWith('/addbalance ')) {
                const parts = text.slice(12).trim().split(' ');
                const identifier = parts[0];
                const amount = parseFloat(parts[1]);
                if (!identifier || isNaN(amount)) {
                    await this.telegramService.sendMessage(chatId, '⚠️ Format: /addbalance email@... 50');
                    return { ok: true };
                }
                let user = identifier.includes('@')
                    ? await this.usersService.findOneByEmail(identifier)
                    : await this.usersService.findOneByPhone(identifier);
                if (!user) {
                    await this.telegramService.sendMessage(chatId, `❌ İstifadəçi tapılmadı: ${identifier}`);
                    return { ok: true };
                }
                await this.usersService.updateBalance(user.id, amount);
                const newBalance = (user.balance || 0) + amount;
                const notifyMsg = `💰 Balansınıza +${amount} ₼ əlavə edildi. Yeni balans: ${newBalance.toFixed(2)} ₼`;
                // Push notification
                await this.notificationsService.sendNotification(
                    user.id, 'BALANCE_ADDED',
                    '💰 Balans artırıldı',
                    notifyMsg,
                    undefined,
                    { amount: String(amount) },
                ).catch(() => {});
                // System notification in support chat (shows as support reply)
                await this.supportService.createSystemNotification(user.id, notifyMsg).catch(() => {});
                await this.telegramService.sendMessage(chatId,
                    `✅ <b>${user.name}</b> balansına <b>+${amount} ₼</b> əlavə edildi\nYeni balans: ${newBalance.toFixed(2)} ₼`);
                return { ok: true };
            }

            // /user email|phone
            if (text.startsWith('/user ')) {
                const identifier = text.slice(6).trim();
                let user = identifier.includes('@')
                    ? await this.usersService.findOneByEmail(identifier)
                    : await this.usersService.findOneByPhone(identifier);
                if (!user) {
                    await this.telegramService.sendMessage(chatId, `❌ İstifadəçi tapılmadı: ${identifier}`);
                    return { ok: true };
                }
                const info = [
                    `👤 <b>${user.name}</b>`,
                    `📧 ${user.email || '—'}`,
                    `📱 ${user.phone || '—'}`,
                    `💰 Balans: <b>${user.balance || 0} ₼</b>`,
                    `🎮 Oyunlar: ${user.gamesPlayed || 0}`,
                    `⭐ Reytinq: ${user.averageRating || 0}`,
                    `🆔 <code>${user.id}</code>`,
                ].join('\n');
                await this.telegramService.sendMessage(chatId, info);
                return { ok: true };
            }

            // /games — today's active games
            if (text === '/games') {
                const result = await this.gamesService.findAll(1, 10, 'open');
                const games = (result as any).data || [];
                if (!games.length) {
                    await this.telegramService.sendMessage(chatId, '📭 Bu gün aktiv oyun yoxdur');
                    return { ok: true };
                }
                const lines = games.map((g: any, i: number) =>
                    `${i + 1}. <b>${g.title}</b> — ${g.date} ${g.time}\n👥 ${g.players?.length || 0}/${g.maxPlayers} | 📍 ${g.location || '—'}`
                ).join('\n\n');
                await this.telegramService.sendMessage(chatId, `⚽ <b>Aktiv oyunlar:</b>\n\n${lines}`);
                return { ok: true };
            }

            // /cancelgame ID reason
            if (text.startsWith('/cancelgame ')) {
                const parts = text.slice(12).trim().split(' ');
                const gameId = parts[0];
                const reason = parts.slice(1).join(' ') || 'Admin tərəfindən ləğv edildi';
                const game = await this.gamesService.findOne(gameId);
                if (!game) {
                    await this.telegramService.sendMessage(chatId, `❌ Oyun tapılmadı: ${gameId}`);
                    return { ok: true };
                }
                await this.gamesService.cancelGame(gameId, game.organizerId, reason);
                await this.telegramService.sendMessage(chatId, `✅ <b>${game.title}</b> ləğv edildi. Bütün oyunçulara 0.50 ₼ qaytarıldı.`);
                return { ok: true };
            }

            // /stats
            if (text === '/stats') {
                const stadiumStats = await this.stadiumsService.getStats();
                const info = [
                    `📊 <b>Statistika</b>`,
                    ``,
                    `🏟 Stadionlar: ${stadiumStats.total} (${stadiumStats.pending} gözləyir)`,
                ].join('\n');
                await this.telegramService.sendMessage(chatId, info);
                return { ok: true };
            }

            // /help
            if (text === '/start' || text === '/help') {
                const help = [
                    `🤖 <b>Topin Admin Bot</b>`,
                    ``,
                    `<b>Dəstək:</b>`,
                    `/tickets — açıq tikerlər`,
                    `/reply ID mətn — tiketə cavab`,
                    ``,
                    `<b>İstifadəçilər:</b>`,
                    `/user email|phone — istifadəçi məlumatı`,
                    `/addbalance email|phone məbləğ — balans artır`,
                    ``,
                    `<b>Oyunlar:</b>`,
                    `/games — aktiv oyunlar`,
                    `/cancelgame ID səbəb — oyunu ləğv et`,
                    ``,
                    `<b>Ümumi:</b>`,
                    `/stats — statistika`,
                ].join('\n');
                await this.telegramService.sendMessage(chatId, help);
                return { ok: true };
            }

        } catch (err: any) {
            this.logger.error('Bot command error:', err?.message);
            await this.telegramService.sendMessage(chatId, `❌ Xəta: ${err?.message || 'Bilinməyən xəta'}`);
        }

        return { ok: true };
    }
}
