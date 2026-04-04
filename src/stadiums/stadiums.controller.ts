import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Inject, forwardRef, Logger } from '@nestjs/common';
import { StadiumsService } from './stadiums.service';
import { TelegramService } from './telegram.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('stadiums')
export class StadiumsController {
    private readonly logger = new Logger(StadiumsController.name);

    constructor(
        private readonly stadiumsService: StadiumsService,
        private readonly telegramService: TelegramService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => GamesService))
        private readonly gamesService: GamesService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Post()
    create(@Body() createStadiumDto: CreateStadiumDto) {
        return this.stadiumsService.create(createStadiumDto);
    }

    @Get()
    findAll() {
        return this.stadiumsService.findAll();
    }

    // Admin endpoints
    @Post(':id/notify')
    notifyAdmin(@Param('id') id: string, @Body('submitterName') submitterName: string) {
        return this.stadiumsService.notifyAdmin(id, submitterName || 'Bilinməyən');
    }

    // ── Telegram webhook ──────────────────────────────────
    @Post('telegram-webhook')
    async telegramWebhook(@Body() body: any) {
        const cb = body?.callback_query;
        if (!cb) return { ok: true };

        // Always answer immediately — dismisses Telegram's loading spinner
        await this.telegramService.answerCallback(cb.id, '⏳').catch(() => {});

        const data: string = cb.data || '';
        const parts = data.split('_');
        const action = parts[0];
        const chatId = cb.message?.chat?.id;
        const msgId = cb.message?.message_id;
        const msgText = cb.message?.text || '';

        this.logger.log(`[webhook] data="${data}" action="${action}" parts=${JSON.stringify(parts)}`);
        this.logger.log(`[webhook] gamesService=${this.gamesService ? 'OK' : 'UNDEFINED'}`);

        try {
            // ── Phone verification ────────────────────────────────
            if (action === 'phone') {
                const subAction = parts[1];
                const userId = parts.slice(2).join('_');
                if (!userId) return { ok: true };

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

            // ── Game approve / reject ─────────────────────────────
            if (action === 'game') {
                const subAction = parts[1];
                const gameId = parts.slice(2).join('_');
                this.logger.log(`[webhook:game] subAction="${subAction}" gameId="${gameId}"`);
                if (!gameId) return { ok: true };

                if (subAction === 'approve') {
                    this.logger.log(`[webhook:game] calling adminApproveGame(${gameId})`);
                    await this.gamesService.adminApproveGame(gameId);
                    this.logger.log(`[webhook:game] adminApproveGame done`);
                    await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n✅ <b>TƏSDİQLƏNDİ — oyunçular üçün açıqdır</b>`).catch(() => {});
                } else if (subAction === 'delete') {
                    this.logger.log(`[webhook:game] calling adminCancelGame(${gameId})`);
                    await this.gamesService.adminCancelGame(gameId);
                    this.logger.log(`[webhook:game] adminCancelGame done`);
                    await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n❌ <b>RƏD EDİLDİ — refund verildi</b>`).catch(() => {});
                }
                return { ok: true };
            }

            // ── Avatar block ──────────────────────────────────────
            if (action === 'avatar') {
                const subAction = parts[1];
                const userId = parts.slice(2).join('_');
                if (subAction === 'block' && userId) {
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

            // ── Stadium approve / reject ──────────────────────────
            const stadiumId = parts[1];
            if (!stadiumId) return { ok: true };

            if (action === 'approve') {
                await this.stadiumsService.approve(stadiumId, 'telegram-admin');
                await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n✅ <b>TƏSDİQ EDİLDİ</b>`).catch(() => {});
            } else if (action === 'reject') {
                await this.stadiumsService.reject(stadiumId, 'Telegram vasitəsilə rədd edildi');
                await this.telegramService.editMessage(chatId, msgId, `${msgText}\n\n❌ <b>RƏD EDİLDİ</b>`).catch(() => {});
            }
        } catch (err) {
            this.logger.error(`[webhook] ERROR: ${err?.message}`, err?.stack);
            this.telegramService.sendMessage(chatId, `⚠️ Xəta: ${err?.message || 'unknown'}`).catch(() => {});
        }

        return { ok: true };
    }

    @Get('admin/all')
    findAllAdmin() {
        return this.stadiumsService.findAllAdmin();
    }

    @Get('admin/pending')
    findPending() {
        return this.stadiumsService.findPending();
    }

    @Get('admin/stats')
    getStats() {
        return this.stadiumsService.getStats();
    }

    @Patch(':id/approve')
    approve(@Param('id') id: string, @Body('adminId') adminId: string) {
        return this.stadiumsService.approve(id, adminId || 'admin');
    }

    @Patch(':id/reject')
    reject(@Param('id') id: string, @Body('reason') reason: string) {
        return this.stadiumsService.reject(id, reason);
    }

    @Patch(':id/suspend')
    suspend(@Param('id') id: string) {
        return this.stadiumsService.suspend(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.stadiumsService.findOne(id);
    }

    @Get('owner/:ownerId')
    findByOwner(@Param('ownerId') ownerId: string) {
        return this.stadiumsService.findByOwner(ownerId);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateData: Partial<CreateStadiumDto>) {
        return this.stadiumsService.update(id, updateData);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.stadiumsService.delete(id);
    }

    @Get(':id/available-slots')
    getAvailableSlots(@Param('id') id: string, @Query('date') date: string) {
        return this.stadiumsService.getAvailableSlots(id, date);
    }
}
