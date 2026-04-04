import { Controller, Post, Req, Body } from '@nestjs/common';
import { Request } from 'express';
import { TelegramService } from '../stadiums/telegram.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly telegramService: TelegramService) {}

    @Post('landing-visit')
    async landingVisit(@Req() req: Request, @Body() body: { referrer?: string; utm?: Record<string, string> }) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        const referrer = body?.referrer || req.headers['referer'] || '';
        const utm = body?.utm || {};
        this.telegramService.sendLandingVisit(ip, userAgent, referrer, utm).catch(() => {});
        return { ok: true };
    }
}
