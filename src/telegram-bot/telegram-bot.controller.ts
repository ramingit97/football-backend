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
            const parts = data.split('_');
            const action = parts[0];
            const chatId = cb.message?.chat?.id;
            const msgId = cb.message?.message_id;
            const msgText = cb.message?.text || '';

            this.logger.log(`[webhook] data="${data}" action="${action}"`);

            // Always answer immediately to dismiss Telegram spinner
            await this.telegramService.answerCallback(cb.id, '⏳').catch(() => {});

            try {
                // ── Stadium approve / reject ──────────────────
                if (action === 'approve') {
                    const stadiumId = parts[1];
                    await this.stadiumsService.approve(stadiumId, 'telegram-admin');
                    await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n✅ <b>TƏSDİQ EDİLDİ</b>`).catch(() => {});
                    return { ok: true };
                }
                if (action === 'reject') {
                    const stadiumId = parts[1];
                    await this.stadiumsService.reject(stadiumId, 'Telegram vasitəsilə rədd edildi');
                    await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n❌ <b>RƏD EDİLDİ</b>`).catch(() => {});
                    return { ok: true };
                }

                // ── Game approve / reject ─────────────────────
                if (action === 'game') {
                    const subAction = parts[1];
                    const gameId = parts.slice(2).join('_');
                    this.logger.log(`[webhook:game] subAction="${subAction}" gameId="${gameId}"`);
                    if (subAction === 'approve') {
                        const approvedGame = await this.gamesService.findOne(gameId);
                        await this.gamesService.adminApproveGame(gameId);

                        // Support-сообщение каждому игроку в игре
                        if (approvedGame) {
                            const dateStr = new Date(approvedGame.date as any).toISOString().slice(0, 10);
                            const supportMsg = `✅ Oyununuz təsdiqləndi! "${approvedGame.title}" — ${dateStr} ${approvedGame.time}, 📍 ${approvedGame.location}. Uğurlar! ⚽`;
                            const players: { id: string; name?: string }[] = approvedGame.players || [];
                            const playerIds = new Set(players.map(p => p.id));
                            playerIds.add(approvedGame.organizerId);
                            for (const userId of playerIds) {
                                this.supportService.create(
                                    userId, '🤖 Sistem', '',
                                    supportMsg,
                                    true, // silent — без Telegram эха
                                ).catch(() => {});
                            }
                        }

                        await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n✅ <b>TƏSDİQLƏNDİ — oyunçular üçün açıqdır</b>`).catch(() => {});
                    } else if (subAction === 'delete') {
                        await this.gamesService.adminCancelGame(gameId);
                        await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n❌ <b>RƏD EDİLDİ — refund verildi</b>`).catch(() => {});
                    }
                    return { ok: true };
                }

                // ── Phone verification ────────────────────────
                if (action === 'phone') {
                    const subAction = parts[1];
                    const userId = parts.slice(2).join('_');
                    if (subAction === 'approve') {
                        const result = await this.usersService.approvePhoneBonus(userId);
                        const label = result.success ? '✅ TƏSDİQLƏNDİ — +2 ₼ verildi' : 'ℹ️ Artıq təsdiqlənib';
                        await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n<b>${label}</b>`).catch(() => {});
                    } else if (subAction === 'reject') {
                        await this.usersService.rejectPhone(userId);
                        await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n❌ <b>RƏD EDİLDİ</b>`).catch(() => {});
                    }
                    return { ok: true };
                }

                // ── Avatar block ──────────────────────────────
                if (action === 'avatar') {
                    const subAction = parts[1];
                    const userId = parts.slice(2).join('_');
                    if (subAction === 'block') {
                        await this.usersService.update(userId, { avatar: null } as any);
                        this.notificationsService.sendNotification(
                            userId, 'SYSTEM',
                            '🚫 Profil şəkliniz silindi',
                            'Profil şəkliniz qaydaları pozduğu üçün admin tərəfindən silindi.',
                        ).catch(() => {});
                        await this.telegramService.editMessageCaption(chatId, msgId,
                            `${cb.message?.caption || ''}\n\n🚫 <b>AVATAR SİLİNDİ</b>`).catch(() => {});
                    }
                    return { ok: true };
                }

            } catch (err: any) {
                this.logger.error(`[webhook] ERROR: ${err?.message}`, err?.stack);
                this.telegramService.sendMessage(chatId, `⚠️ Xəta: ${err?.message || 'unknown'}`).catch(() => {});
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
                const esc = (s: any) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const posLabels: Record<string, string> = { goalkeeper: '🧤 Qapıçı', defender: '🛡 Müdafiəçi', midfielder: '⚙️ Yarım', forward: '⚡ Hücumçu', any: '🌐 Fərq etməz' };
                const styleLabels: Record<string, string> = { technical: '🎯 Texniki', physical: '💪 Fiziki', tactical: '🧠 Taktiki', aggressive: '🔥 Aqressiv' };
                const badgeCount = Object.values(user.receivedBadges || {}).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
                const joinDate = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : '—';
                const lastPlayed = user.lastPlayedAt ? new Date(user.lastPlayedAt).toISOString().slice(0, 10) : '—';
                const blockedLine = user.blocked
                    ? `\n🚫 <b>BLOKLANIB</b>${user.blockedReason ? ` — ${esc(user.blockedReason)}` : ''}`
                    : '';
                const info = [
                    `👤 <b>${esc(user.name)}</b>${user.blocked ? ' 🚫' : ''}`,
                    `📧 ${esc(user.email) || '—'}`,
                    `📱 ${esc(user.phone) || '—'}`,
                    `🎭 Rol: ${user.role || 'player'} | 🌐 Dil: ${user.language || 'ru'}`,
                    ``,
                    `⚽ Mövqe: ${posLabels[user.position] || esc(user.position) || '—'} | 🎮 Üslub: ${styleLabels[user.playStyle] || esc(user.playStyle) || '—'}`,
                    user.skillLevel ? `🎯 Səviyyə: ${esc(user.skillLevel)}` : null,
                    (user.age || user.height || user.weight) ? `📏 Yaş: ${user.age || '—'} | Boy: ${user.height || '—'} sm | Çəki: ${user.weight || '—'} kq` : null,
                    user.preferredFoot ? `🦶 Ayaq: ${user.preferredFoot}` : null,
                    (user.district || user.metro) ? `📍 ${esc(user.district) || '—'}${user.metro ? ` (${esc(user.metro)})` : ''}` : null,
                    ``,
                    `💰 Balans: <b>${(user.balance || 0).toFixed(2)} ₼</b>`,
                    `🎮 Oyunlar: <b>${user.gamesPlayed || 0}</b> | ⭐ Reytinq: <b>${(user.averageRating || 0).toFixed(2)}</b>`,
                    `⚽ Qollar: ${user.totalGoals || 0} | 🎯 Ötürmələr: ${user.totalAssists || 0} | 🏆 MOTM: ${user.manOfTheMatchCount || 0}`,
                    `🔥 Ataka: ${user.attackRating || 50} | 🛡 Müdafiə: ${user.defenseRating || 50} | ⚡ Sürət: ${user.speedRating || 50} | 💪 Dözüm: ${user.staminaRating || 50}`,
                    `✨ XP: ${user.xp || 0} | Lv: ${user.level || 1} | 🏅 Badgelər: ${badgeCount}`,
                    (user.noShowCount || user.warningCount) ? `⚠️ No-show: ${user.noShowCount || 0} | Xəbərdarlıq: ${user.warningCount || 0}` : null,
                    ``,
                    `📅 Qeydiyyat: ${joinDate} | Son oyun: ${lastPlayed}`,
                    `🆔 <code>${user.id}</code>`,
                    blockedLine || null,
                ].filter(l => l !== null).join('\n');
                await this.telegramService.sendMessage(chatId, info);
                return { ok: true };
            }

            // /msg email|phone mətn
            if (text.startsWith('/msg ')) {
                const parts = text.slice(5).trim().split(' ');
                const identifier = parts[0];
                const msgText = parts.slice(1).join(' ');
                if (!identifier || !msgText) {
                    await this.telegramService.sendMessage(chatId, '⚠️ Format: /msg email|phone mətn');
                    return { ok: true };
                }
                const user = identifier.includes('@')
                    ? await this.usersService.findOneByEmail(identifier)
                    : await this.usersService.findOneByPhone(identifier);
                if (!user) {
                    await this.telegramService.sendMessage(chatId, `❌ İstifadəçi tapılmadı: ${identifier}`);
                    return { ok: true };
                }
                await this.supportService.createSystemNotification(user.id, msgText);
                await this.notificationsService.sendNotification(
                    user.id, 'SUPPORT_REPLY',
                    '💬 Dəstək mesajı',
                    msgText,
                ).catch(() => {});
                await this.telegramService.sendMessage(chatId,
                    `✅ <b>${user.name}</b> üçün mesaj göndərildi:\n<i>${msgText}</i>`);
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

            // /ban email|phone reason
            if (text.startsWith('/ban ')) {
                const parts = text.slice(5).trim().split(' ');
                const identifier = parts[0];
                const reason = parts.slice(1).join(' ') || 'Admin tərəfindən bloklandı';
                const user = identifier.includes('@')
                    ? await this.usersService.findOneByEmail(identifier)
                    : await this.usersService.findOneByPhone(identifier);
                if (!user) {
                    await this.telegramService.sendMessage(chatId, `❌ İstifadəçi tapılmadı: ${identifier}`);
                    return { ok: true };
                }
                await this.usersService.blockUser(user.id, reason);
                this.notificationsService.sendNotification(
                    user.id, 'ACCOUNT_BLOCKED',
                    '🚫 Hesabınız bloklandı',
                    `Səbəb: ${reason}`,
                ).catch(() => {});
                await this.telegramService.sendMessage(chatId,
                    `🚫 <b>${user.name}</b> bloklandı\nSəbəb: ${reason}`);
                return { ok: true };
            }

            // /unban email|phone
            if (text.startsWith('/unban ')) {
                const identifier = text.slice(7).trim();
                const user = identifier.includes('@')
                    ? await this.usersService.findOneByEmail(identifier)
                    : await this.usersService.findOneByPhone(identifier);
                if (!user) {
                    await this.telegramService.sendMessage(chatId, `❌ İstifadəçi tapılmadı: ${identifier}`);
                    return { ok: true };
                }
                await this.usersService.unblockUser(user.id);
                this.notificationsService.sendNotification(
                    user.id, 'ACCOUNT_UNBLOCKED',
                    '✅ Hesabınız aktiv edildi',
                    'Hesabınıza giriş bərpa edildi.',
                ).catch(() => {});
                await this.telegramService.sendMessage(chatId,
                    `✅ <b>${user.name}</b> blokdan çıxarıldı`);
                return { ok: true };
            }

            // /broadcast Başlıq | Mətn
            if (text.startsWith('/broadcast ')) {
                const content = text.slice(11).trim();
                const sepIdx = content.indexOf('|');
                const title = sepIdx !== -1 ? content.slice(0, sepIdx).trim() : 'Bildiriş';
                const message = sepIdx !== -1 ? content.slice(sepIdx + 1).trim() : content;
                if (!message) {
                    await this.telegramService.sendMessage(chatId, '⚠️ Format: /broadcast Başlıq | Mətn');
                    return { ok: true };
                }
                await this.telegramService.sendMessage(chatId, '⏳ Göndərilir...');
                const result = await this.notificationsService.broadcastToAll(title, message);
                await this.telegramService.sendMessage(chatId,
                    `📢 <b>Broadcast tamamlandı</b>\n✅ Göndərildi: ${result.sent}\n❌ Xəta: ${result.failed}`);
                return { ok: true };
            }

            // /revenue
            if (text === '/revenue') {
                const stats = await this.usersService.getRevenueStats();
                const info = [
                    `💰 <b>Gəlir statistikası</b>`,
                    ``,
                    `📅 Bu gün: <b>${stats.today.toFixed(2)} ₼</b>`,
                    `📆 Bu həftə: <b>${stats.week.toFixed(2)} ₼</b>`,
                    `🗓 Cəmi: <b>${stats.total.toFixed(2)} ₼</b>`,
                    `🔢 Ümumi əməliyyat: ${stats.txCount}`,
                ].join('\n');
                await this.telegramService.sendMessage(chatId, info);
                return { ok: true };
            }

            // /users [N]
            if (text.startsWith('/users')) {
                const limitArg = parseInt(text.split(' ')[1] || '10', 10);
                const limit = isNaN(limitArg) ? 10 : Math.min(limitArg, 25);
                const users = await this.usersService.findRecent(limit);
                const userStats = await this.usersService.getStats();
                const lines = users.map((u, i) => {
                    const status = u.blocked ? '🚫' : '✅';
                    const date = new Date(u.createdAt).toISOString().slice(0, 10);
                    return `${i + 1}. ${status} <b>${u.name || '—'}</b> | ${u.email}\n    🎮 ${u.gamesPlayed} oyun · 💰 ${(u.balance || 0).toFixed(2)} ₼ · ${date}`;
                }).join('\n\n');
                await this.telegramService.sendMessage(chatId,
                    `👥 <b>Son ${limit} istifadəçi</b> (cəmi: ${userStats.total}, bu gün: +${userStats.newToday})\n\n${lines}`);
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
                    `<b>İstifadəçilər:</b>`,
                    `/users [N] — son N istifadəçi (def: 10)`,
                    `/user email|phone — istifadəçi məlumatı`,
                    `/addbalance email|phone məbləğ — balans artır`,
                    `/ban email|phone səbəb — blokla`,
                    `/unban email|phone — blokdan çıxar`,
                    ``,
                    `<b>Maliyyə:</b>`,
                    `/revenue — gəlir statistikası`,
                    ``,
                    `<b>Bildirişlər:</b>`,
                    `/broadcast Başlıq | Mətn — hamıya push`,
                    ``,
                    `<b>Dəstək:</b>`,
                    `/tickets — açıq tikerlər`,
                    `/reply ID mətn — tiketə cavab`,
                    `/msg email|phone mətn — istifadəçiyə mesaj göndər`,
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
