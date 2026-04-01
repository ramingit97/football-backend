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
        await fetch(`${this.apiUrl}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    async sendStadiumRequest(stadium: any, submitterName: string): Promise<void> {
        if (!this.isConfigured) {
            this.logger.warn('Telegram not configured — skipping notification');
            return;
        }

        const amenitiesText = Array.isArray(stadium.amenities) && stadium.amenities.length
            ? stadium.amenities.join(', ')
            : '—';

        const lines = [
            `🏟 *Yeni stadion təklifi*`,
            ``,
            `*Ad:* ${stadium.name}`,
            `*Ünvan:* ${stadium.location}`,
            stadium.district ? `*Rayon:* ${stadium.district}` : null,
            stadium.metro    ? `*Metro:* ${stadium.metro}`    : null,
            `*Qiymət:* ${stadium.pricePerHour} ₼/saat`,
            `*İş saatları:* ${stadium.openTime} – ${stadium.closeTime}`,
            `*Şəraiti:* ${amenitiesText}`,
            stadium.description ? `*Açıqlama:* ${stadium.description}` : null,
            stadium.stadiumLink ? `*Google Maps:* ${stadium.stadiumLink}` : null,
            ``,
            `👤 *Göndərən:* ${submitterName}`,
            `🆔 \`${stadium.id}\``,
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
                parse_mode: 'Markdown',
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
                parse_mode: 'Markdown',
            });
        } catch (err: any) {
            this.logger.error('Telegram editMessage failed:', err?.message);
        }
    }
}
