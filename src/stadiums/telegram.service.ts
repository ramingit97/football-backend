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
            stadium.description  ? `<b>Açıqlama:</b> ${esc(stadium.description)}`    : null,
            stadium.stadiumLink  ? `<b>Google Maps:</b> ${esc(stadium.stadiumLink)}`   : null,
            stadium.contactPhone ? `📞 <b>Əlaqə nömrəsi:</b> <code>${esc(stadium.contactPhone)}</code>` : null,
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

    private parseUA(ua: string): { browser: string; os: string; device: string } {
        const s = ua || '';
        let browser = 'Unknown';
        if (/Edg\//.test(s))         browser = 'Edge';
        else if (/OPR\/|Opera/.test(s)) browser = 'Opera';
        else if (/Chrome\//.test(s)) browser = 'Chrome';
        else if (/Firefox\//.test(s)) browser = 'Firefox';
        else if (/Safari\//.test(s)) browser = 'Safari';

        let os = 'Unknown';
        if (/Windows NT 10/.test(s))     os = 'Windows 10/11';
        else if (/Windows/.test(s))      os = 'Windows';
        else if (/iPhone/.test(s))       os = 'iOS (iPhone)';
        else if (/iPad/.test(s))         os = 'iOS (iPad)';
        else if (/Android/.test(s)) {
            const v = s.match(/Android ([\d.]+)/)?.[1];
            os = v ? `Android ${v}` : 'Android';
        }
        else if (/Mac OS X/.test(s))     os = 'macOS';
        else if (/Linux/.test(s))        os = 'Linux';

        const device = /Mobile|Android|iPhone|iPad/.test(s) ? '📱 Mobil' : '🖥 Desktop';
        return { browser, os, device };
    }

    private async geoLookup(ip: string): Promise<{ flag: string; city: string; country: string; isp: string } | null> {
        // Skip private / loopback IPs
        if (!ip || ip === 'unknown' || /^(127\.|::1|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(ip)) return null;
        try {
            const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp`, {
                signal: AbortSignal.timeout(3000),
            });
            const data: any = await res.json();
            if (data.status !== 'success') return null;
            const flags: Record<string, string> = { AZ: '🇦🇿', TR: '🇹🇷', RU: '🇷🇺', UA: '🇺🇦', US: '🇺🇸', DE: '🇩🇪', GB: '🇬🇧', FR: '🇫🇷', NL: '🇳🇱' };
            const flag = flags[data.countryCode] || '🌍';
            return { flag, city: data.city || '—', country: data.country || '—', isp: data.isp || '—' };
        } catch {
            return null;
        }
    }

    private formatReferrer(ref: string): string {
        if (!ref) return '🔗 Birbaşa / bilinmir';
        try {
            const host = new URL(ref).hostname.replace(/^www\./, '');
            const icons: Record<string, string> = {
                'google.com': '🔍 Google',
                'instagram.com': '📸 Instagram',
                'facebook.com': '📘 Facebook',
                't.me': '💬 Telegram',
                'twitter.com': '🐦 Twitter',
                'x.com': '🐦 X (Twitter)',
                'youtube.com': '▶️ YouTube',
                'whatsapp.com': '💚 WhatsApp',
                'linkedin.com': '💼 LinkedIn',
            };
            return icons[host] || `🔗 ${host}`;
        } catch {
            return `🔗 ${ref.slice(0, 60)}`;
        }
    }

    async sendLandingVisit(ip?: string, userAgent?: string, referrer?: string, utm?: Record<string, string>): Promise<void> {
        if (!this.isConfigured) return;
        this.landingVisitCount++;
        const now = Date.now();
        if (now - this.lastLandingNotif < 5 * 60 * 1000) return; // 5 min cooldown
        this.lastLandingNotif = now;

        const count = this.landingVisitCount;
        this.landingVisitCount = 0;

        const { browser, os, device } = this.parseUA(userAgent || '');
        const geo = await this.geoLookup(ip || '');
        const refLine = this.formatReferrer(referrer || '');

        const utmLines: string[] = [];
        if (utm && Object.keys(utm).length > 0) {
            if (utm.utm_source)   utmLines.push(`📣 Mənbə: ${utm.utm_source}`);
            if (utm.utm_medium)   utmLines.push(`📡 Kanal: ${utm.utm_medium}`);
            if (utm.utm_campaign) utmLines.push(`🎯 Kampaniya: ${utm.utm_campaign}`);
        }

        const lines = [
            `👀 <b>Yeni lənding ziyarəti</b>`,
            ``,
            geo
                ? `${geo.flag} ${geo.city}, ${geo.country} | <i>${geo.isp}</i>`
                : `🌐 IP: <code>${ip || '—'}</code>`,
            geo ? `🌐 IP: <code>${ip}</code>` : null,
            ``,
            `${device}  •  🌐 ${browser}  •  💻 ${os}`,
            ``,
            `↩️ Gəliş: ${refLine}`,
            ...utmLines,
            ``,
            `🔢 Son 5 dəqiqədə: <b>${count}</b> ziyarət`,
        ].filter(l => l !== null).join('\n');

        try {
            await this.post('sendMessage', {
                chat_id: this.chatId, text: lines, parse_mode: 'HTML',
                disable_web_page_preview: true,
            });
        } catch (err: any) {
            this.logger.error('Telegram sendLandingVisit failed:', err?.message);
        }
    }

    async sendRegistrationStarted(ip?: string, userAgent?: string): Promise<void> {
        if (!this.isConfigured) return;
        const { browser, os, device } = this.parseUA(userAgent || '');
        const geo = await this.geoLookup(ip || '');
        const lines = [
            `📝 <b>Qeydiyyat başlandı</b>`,
            ``,
            geo
                ? `${geo.flag} ${geo.city}, ${geo.country} | <i>${geo.isp}</i>\n🌐 IP: <code>${ip}</code>`
                : `🌐 IP: <code>${ip || '—'}</code>`,
            ``,
            `${device}  •  🌐 ${browser}  •  💻 ${os}`,
            ``,
            `⏳ Qeydiyyatı tamamlayıb-tamamlamadığını gözlə...`,
        ].filter(Boolean).join('\n');
        try {
            await this.post('sendMessage', { chat_id: this.chatId, text: lines, parse_mode: 'HTML', disable_web_page_preview: true });
        } catch (err: any) {
            this.logger.error('Telegram sendRegistrationStarted failed:', err?.message);
        }
    }

    async sendRegistrationCompleted(ip?: string, userAgent?: string, data?: {
        name?: string; email?: string; phone?: string; position?: string; playStyle?: string;
    }): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const { browser, os, device } = this.parseUA(userAgent || '');
        const geo = await this.geoLookup(ip || '');

        const positionLabels: Record<string, string> = {
            goalkeeper: '🧤 Qapıçı', defender: '🛡 Müdafiəçi',
            midfielder: '⚙️ Yarımmüdafiəçi', forward: '⚡ Hücumçu', any: '🌐 Fərq etməz',
        };
        const playStyleLabels: Record<string, string> = {
            technical: '🎯 Texniki', physical: '💪 Fiziki',
            tactical: '🧠 Taktiki', aggressive: '🔥 Aqressiv',
        };

        const lines = [
            `✅ <b>Qeydiyyat tamamlandı!</b>`,
            ``,
            data?.name  ? `👤 Ad: <b>${esc(data.name)}</b>` : null,
            data?.email && !data.email.includes('@phone.auth') ? `📧 Email: ${esc(data.email)}` : null,
            data?.phone ? `📱 Telefon: <code>${esc(data.phone)}</code>` : null,
            data?.position  ? `⚽ Mövqe: ${positionLabels[data.position]  || esc(data.position)}`  : null,
            data?.playStyle ? `🎮 Oyun tərzi: ${playStyleLabels[data.playStyle] || esc(data.playStyle)}` : null,
            ``,
            geo
                ? `${geo.flag} ${geo.city}, ${geo.country} | <i>${geo.isp}</i>\n🌐 IP: <code>${ip}</code>`
                : `🌐 IP: <code>${ip || '—'}</code>`,
            `${device}  •  🌐 ${browser}  •  💻 ${os}`,
        ].filter(Boolean).join('\n');
        try {
            await this.post('sendMessage', { chat_id: this.chatId, text: lines, parse_mode: 'HTML', disable_web_page_preview: true });
        } catch (err: any) {
            this.logger.error('Telegram sendRegistrationCompleted failed:', err?.message);
        }
    }

    // ── New user registered ───────────────────────────────────
    async sendNewUser(user: {
        name?: string; email?: string; phone?: string;
        id?: string; role?: string; position?: string; playStyle?: string;
    }): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const positionLabels: Record<string, string> = {
            goalkeeper: '🧤 Qapıçı', defender: '🛡 Müdafiəçi',
            midfielder: '⚙️ Yarımmüdafiəçi', forward: '⚡ Hücumçu', any: '🌐 Fərq etməz',
        };
        const playStyleLabels: Record<string, string> = {
            technical: '🎯 Texniki', physical: '💪 Fiziki',
            tactical: '🧠 Taktiki', aggressive: '🔥 Aqressiv',
        };

        const text = [
            `🎉 <b>Yeni istifadəçi qeydiyyatdan keçdi!</b>`,
            ``,
            `👤 Ad: <b>${esc(user.name || '—')}</b>`,
            user.email && !user.email.includes('@phone.auth') ? `📧 Email: ${esc(user.email)}` : null,
            user.phone ? `📱 Telefon: <code>${esc(user.phone)}</code>` : null,
            user.position ? `⚽ Mövqe: ${positionLabels[user.position] || esc(user.position)}` : null,
            user.playStyle ? `🎮 Oyun tərzi: ${playStyleLabels[user.playStyle] || esc(user.playStyle)}` : null,
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
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Təsdiqlə',  callback_data: `game_approve_${game.id}` },
                        { text: '❌ Rədd et',   callback_data: `game_delete_${game.id}` },
                    ]],
                },
            });
        } catch (err: any) {
            this.logger.error('Telegram sendNewGame failed:', err?.message);
        }
    }

    async sendAvatarUpload(user: { id: string; name?: string; email?: string }, avatarUrl: string): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const caption = [
            `🖼 <b>Yeni profil şəkli</b>`,
            ``,
            `👤 ${esc(user.name || '—')}`,
            user.email && !user.email.includes('@phone.auth') ? `📧 ${esc(user.email)}` : null,
            `🆔 <code>${user.id}</code>`,
        ].filter(Boolean).join('\n');
        try {
            await this.post('sendPhoto', {
                chat_id: this.chatId,
                photo: avatarUrl,
                caption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🚫 Avatarı sil', callback_data: `avatar_block_${user.id}` },
                    ]],
                },
            });
        } catch (err: any) {
            this.logger.error('Telegram sendAvatarUpload failed:', err?.message);
        }
    }

    async sendPhoneVerification(user: { id: string; name?: string; phone?: string; email?: string }, isAutoFormat = false): Promise<void> {
        if (!this.isConfigured) return;
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const text = [
            `📱 <b>Telefon nömrəsi yoxlanması</b>`,
            ``,
            `👤 İstifadəçi: <b>${esc(user.name || '—')}</b>`,
            user.email && !user.email.includes('@phone.auth') ? `📧 ${esc(user.email)}` : null,
            `📞 Nömrə: <code>${esc(user.phone || '—')}</code>`,
            `🆔 <code>${user.id}</code>`,
            ``,
            isAutoFormat
                ? `🤖 AZ formatı — 30 dəq sonra <b>avtomatik təsdiqlənəcək</b>. Yalnız rədd etmək istəsəniz basın:`
                : `Nömrəni yoxlayın:`,
        ].filter(Boolean).join('\n');

        const replyMarkup = {
            inline_keyboard: [isAutoFormat
                ? [{ text: '❌ Rədd et (ləğv et)', callback_data: `phone_reject_${user.id}` }]
                : [
                    { text: '✅ Təsdiqlə (+2 ₼)', callback_data: `phone_approve_${user.id}` },
                    { text: '❌ Rədd et',         callback_data: `phone_reject_${user.id}` },
                ]
            ],
        };

        try {
            await this.post('sendMessage', {
                chat_id: this.chatId, text, parse_mode: 'HTML',
                reply_markup: replyMarkup,
                disable_web_page_preview: true,
            });
        } catch (err: any) {
            this.logger.error('Telegram sendPhoneVerification failed:', err?.message);
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

    async editMessageCaption(chatId: string | number, messageId: number, caption: string): Promise<void> {
        if (!this.isConfigured) return;
        try {
            await this.post('editMessageCaption', {
                chat_id: chatId,
                message_id: messageId,
                caption,
                parse_mode: 'HTML',
            });
        } catch (err: any) {
            this.logger.error('Telegram editMessageCaption failed:', err?.message);
        }
    }
}
