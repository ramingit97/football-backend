import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string;
    private readonly chatId: string;

    constructor(private configService: ConfigService) {
        this.botToken = configService.get<string>('TELEGRAM_BOT_TOKEN', '');
        this.chatId = configService.get<string>('TELEGRAM_CHAT_ID', '');
    }

    private get apiUrl() {
        return `https://api.telegram.org/bot${this.botToken}`;
    }

    private get isConfigured(): boolean {
        return !!(this.botToken && this.chatId);
    }

    private async post(method: string, body: object): Promise<void> {
        const res = await fetch(`${this.apiUrl}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`Telegram ${method} failed [${res.status}]: ${text}`);
        }
    }

    async sendStadiumRequest(stadium: any, submitterName: string): Promise<void> {
        if (!this.isConfigured) {
            this.logger.warn('Telegram not configured — skipping notification');
            return;
        }

        const amenitiesText = Array.isArray(stadium.amenities) && stadium.amenities.length
            ? stadium.amenities.join(', ')
            : '—';

        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const lines = [
            `🏟 <b>Yeni stadion təklifi</b>`,
            ``,
            `<b>Ad:</b> ${esc(stadium.name)}`,
            `<b>Ünvan:</b> ${esc(stadium.location)}`,
            stadium.district ? `<b>Rayon:</b> ${esc(stadium.district)}` : null,
            stadium.metro    ? `<b>Metro:</b> ${esc(stadium.metro)}`    : null,
            `<b>Qiymət:</b> ${stadium.pricePerHour} ₼/saat`,
            `<b>İş saatları:</b> ${stadium.openTime} – ${stadium.closeTime}`,
            `<b>Şəraiti:</b> ${esc(amenitiesText)}`,
            stadium.description ? `<b>Açıqlama:</b> ${esc(stadium.description)}` : null,
            stadium.stadiumLink ? `<b>Google Maps:</b> ${esc(stadium.stadiumLink)}` : null,
            ``,
            `👤 <b>Göndərən:</b> ${esc(submitterName)}`,
            `🆔 <code>${stadium.id}</code>`,
        ].filter(Boolean).join('\n');

        const replyMarkup = {
            inline_keyboard: [[
                { text: '✅ Təsdiq et', callback_data: `approve_${stadium.id}` },
                { text: '❌ Rədd et',   callback_data: `reject_${stadium.id}`  },
            ]],
        };

        try {
            await this.post('sendMessage', {
                chat_id: this.chatId,
                text: lines,
                parse_mode: 'HTML',
                reply_markup: replyMarkup,
                disable_web_page_preview: true,
            });

            const images = (stadium.images || []).filter(Boolean).slice(0, 10);
            if (images.length > 0) {
                const media = images.map((url: string, i: number) => ({
                    type: 'photo',
                    media: url,
                    ...(i === 0 ? { caption: `📸 ${stadium.name}` } : {}),
                }));
                await this.post('sendMediaGroup', { chat_id: this.chatId, media });
            }
        } catch (err: any) {
            this.logger.error('Telegram sendStadiumRequest failed:', err?.message);
        }
    }

    // ── Landing page visit (debounced — max 1 per 5 min) ─────
    private lastLandingNotif = 0;
    private landingVisitCount = 0;

    async sendLandingVisit(ip?: string, userAgent?: string): Promise<void> {
        if (!this.isConfigured) return;
        this.landingVisitCount++;
        const now = Date.now();
        if (now - this.lastLandingNotif < 5 * 60 * 1000) return; // 5 min cooldown
        this.lastLandingNotif = now;
        const ua = userAgent ? userAgent.slice(0, 80) : '—';
        const text = [
            `👀 <b>Lənding səhifəsinə giriş</b>`,
            ``,
            `🌐 IP: <code>${ip || '—'}</code>`,
            `📱 Agent: <i>${ua}</i>`,
            `🔢 Son 5 dəqiqədə: <b>${this.landingVisitCount}</b> ziyarət`,
        ].join('\n');
        try {
            await this.post('sendMessage', {
                chat_id: this.chatId, text, parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
            this.landingVisitCount = 0;
        } catch (err: any) {
            this.logger.error('Telegram sendLandingVisit failed:', err?.message);
        }
    }

    // ── New user registered ───────────────────────────────────
    async sendNewUser(user: { name?: string; email?: string; phone?: string; id?: string; role?: string }): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const text = [
            `🎉 <b>Yeni istifadəçi qeydiyyatdan keçdi!</b>`,
            ``,
            `👤 Ad: <b>${esc(user.name || '—')}</b>`,
            user.email ? `📧 Email: ${esc(user.email)}` : null,
            user.phone ? `📱 Telefon: ${esc(user.phone)}` : null,
            `🎭 Rol: ${user.role || 'player'}`,
            `🆔 <code>${user.id || '—'}</code>`,
        ].filter(Boolean).join('\n');
        try {
            await this.post('sendMessage', {
                chat_id: this.chatId, text, parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        } catch (err: any) {
            this.logger.error('Telegram sendNewUser failed:', err?.message);
        }
    }

    // ── New game created ──────────────────────────────────────
    async sendNewGame(game: {
        title?: string; date?: string; time?: string;
        format?: string; maxPlayers?: number; price?: number;
        location?: string; district?: string; organizerName?: string;
        skillLevel?: string; isUrgent?: boolean; gameType?: string; id?: string;
    }): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const urgent = game.isUrgent ? '🔥 TƏCİLİ! ' : '';
        const text = [
            `⚽ ${urgent}<b>Yeni oyun yaradıldı!</b>`,
            ``,
            `🏷 Ad: <b>${esc(game.title || '—')}</b>`,
            `📅 Tarix: ${game.date || '—'} ${game.time || ''}`,
            `📍 Yer: ${esc(game.location || '—')}`,
            game.district ? `🗺 Rayon: ${esc(game.district)}` : null,
            `⚽ Format: ${game.format || '—'} | 👥 Max: ${game.maxPlayers || '—'}`,
            `💰 Qiymət: ${game.price ? game.price + ' ₼' : 'Pulsuz'}`,
            game.skillLevel ? `🎯 Səviyyə: ${game.skillLevel}` : null,
            `🔒 Növ: ${game.gameType === 'private' ? 'Qapalı' : 'Açıq'}`,
            `👤 Təşkilatçı: ${esc(game.organizerName || '—')}`,
            `🆔 <code>${game.id || '—'}</code>`,
        ].filter(Boolean).join('\n');
        try {
            await this.post('sendMessage', {
                chat_id: this.chatId, text, parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        } catch (err: any) {
            this.logger.error('Telegram sendNewGame failed:', err?.message);
        }
    }

    async sendMessage(chatId: string | number, text: string): Promise<void> {
        if (!this.isConfigured) return;
        try {
            await this.post('sendMessage', {
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        } catch (err: any) {
            this.logger.error('Telegram sendMessage failed:', err?.message);
        }
    }

    async answerCallback(callbackQueryId: string, text: string): Promise<void> {
        if (!this.isConfigured) return;
        try {
            await this.post('answerCallbackQuery', {
                callback_query_id: callbackQueryId,
                text,
                show_alert: false,
            });
        } catch (err: any) {
            this.logger.error('Telegram answerCallback failed:', err?.message);
        }
    }

    async editMessage(chatId: string | number, messageId: number, text: string): Promise<void> {
        if (!this.isConfigured) return;
        try {
            await this.post('editMessageText', {
                chat_id: chatId,
                message_id: messageId,
                text,
                parse_mode: 'HTML',
            });
        } catch (err: any) {
            this.logger.error('Telegram editMessage failed:', err?.message);
        }
    }
}
