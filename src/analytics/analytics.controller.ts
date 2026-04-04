import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { TelegramService } from '../stadiums/telegram.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly telegramService: TelegramService) {}

    @Post('landing-visit')
    async landingVisit(@Req() req: Request) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';
        const userAgent = req.headers['user-agent'] || '';
        this.telegramService.sendLandingVisit(ip, userAgent).catch(() => {});
        return { ok: true };
    }
}
