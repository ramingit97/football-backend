import { Controller, Post, Req, Body } from '@nestjs/common';
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
