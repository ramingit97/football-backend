import { Controller, Post, Req, Body, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { TelegramService } from '../stadiums/telegram.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly telegramService: TelegramService) {}

    private getIp(req: Request): string {
        return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';
    }

    @Post('landing-visit')
    async landingVisit(@Req() req: Request, @Body() body: { referrer?: string; utm?: Record<string, string> }) {
        const ip = this.getIp(req);
        const userAgent = req.headers['user-agent'] || '';
        const referrer = body?.referrer || req.headers['referer'] || '';
        const utm = body?.utm || {};
        this.telegramService.sendLandingVisit(ip, userAgent, referrer, utm).catch(() => {});
        return { ok: true };
    }

    @Post('registration-started')
    async registrationStarted(@Req() req: Request) {
        const ip = this.getIp(req);
        const userAgent = req.headers['user-agent'] || '';
        this.telegramService.sendRegistrationStarted(ip, userAgent).catch(() => {});
        return { ok: true };
    }

    @Post('feedback')
    @HttpCode(200)
    async submitFeedback(
        @Req() req: Request,
        @Body() body: { rating?: number; text?: string; userName?: string; userId?: string },
    ) {
        const stars = '⭐'.repeat(Math.min(5, Math.max(1, body.rating || 5)));
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const lines = [
            `💬 <b>Yeni rəy</b>`,
            ``,
            `${stars} <b>${body.rating || '?'}/5</b>`,
            body.userName ? `👤 ${esc(body.userName)}` : null,
            body.userId   ? `🆔 <code>${body.userId}</code>` : null,
            ``,
            body.text ? `"${esc(body.text)}"` : '<i>Mətn yoxdur</i>',
        ].filter(Boolean).join('\n');
        this.telegramService.sendMessage(process.env.TELEGRAM_CHAT_ID || '', lines).catch(() => {});
        return { ok: true };
    }

    @Post('registration-completed')
    async registrationCompleted(
        @Req() req: Request,
        @Body() body: { name?: string; email?: string; phone?: string; position?: string; playStyle?: string },
    ) {
        const ip = this.getIp(req);
        const userAgent = req.headers['user-agent'] || '';
        this.telegramService.sendRegistrationCompleted(ip, userAgent, body).catch(() => {});
        return { ok: true };
    }
}
