import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Inject, forwardRef } from '@nestjs/common';
import { StadiumsService } from './stadiums.service';
import { TelegramService } from './telegram.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UsersService } from '../users/users.service';
import { GamesService } from '../games/games.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('stadiums')
export class StadiumsController {
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

        const data: string = cb.data || '';
        const parts = data.split('_');
        const action = parts[0];

        // ── Phone verification callbacks ─────────────────────────
        if (action === 'phone') {
            const subAction = parts[1]; // 'approve' | 'reject'
            const userId = parts.slice(2).join('_');
            if (!userId) { await this.telegramService.answerCallback(cb.id, '❓ Bilinməyən əmr'); return { ok: true }; }

            if (subAction === 'approve') {
                const result = await this.usersService.approvePhoneBonus(userId);
                if (result.success) {
                    await this.telegramService.answerCallback(cb.id, '✅ Telefon təsdiqləndi, +2 ₼ verildi!');
                    await this.telegramService.editMessage(cb.message.chat.id, cb.message.message_id, `${cb.message.text}\n\n✅ <b>TƏSDİQLƏNDİ — +2 ₼ verildi</b>`);
                } else {
                    await this.telegramService.answerCallback(cb.id, 'ℹ️ Artıq təsdiqlənib');
                }
            } else if (subAction === 'reject') {
                await this.usersService.rejectPhone(userId);
                await this.telegramService.answerCallback(cb.id, '❌ Nömrə rədd edildi');
                await this.telegramService.editMessage(cb.message.chat.id, cb.message.message_id, `${cb.message.text}\n\n❌ <b>RƏD EDİLDİ</b>`);
            }
            return { ok: true };
        }

        // ── Game approve / delete callbacks ───────────────────────
        if (action === 'game') {
            const subAction = parts[1]; // 'approve' | 'delete'
            const gameId = parts.slice(2).join('_');
            if (subAction === 'approve' && gameId) {
                await this.gamesService.adminApproveGame(gameId);
                await this.telegramService.answerCallback(cb.id, '✅ Oyun təsdiqləndi, oyunçular görə bilər!');
                await this.telegramService.editMessage(
                    cb.message.chat.id, cb.message.message_id,
                    `${cb.message.text}\n\n✅ <b>TƏSDİQLƏNDİ — oyunçular üçün açıqdır</b>`,
                );
            } else if (subAction === 'delete' && gameId) {
                await this.gamesService.adminCancelGame(gameId);
                await this.telegramService.answerCallback(cb.id, '❌ Oyun rədd edildi, refund göndərildi');
                await this.telegramService.editMessage(
                    cb.message.chat.id, cb.message.message_id,
                    `${cb.message.text}\n\n❌ <b>RƏD EDİLDİ — refund verildi (admin tərəfindən)</b>`,
                );
            }
            return { ok: true };
        }

        // ── Avatar block callback ─────────────────────────────────
        if (action === 'avatar') {
            const subAction = parts[1]; // 'block'
            const userId = parts.slice(2).join('_');
            if (subAction === 'block' && userId) {
                await this.usersService.update(userId, { avatar: null } as any);
                this.notificationsService.sendNotification(
                    userId, 'SYSTEM',
                    '🚫 Profil şəkliniz silindi',
                    'Profil şəkliniz qaydaları pozduğu üçün admin tərəfindən silindi. Zəhmət olmasa uyğun bir şəkil yükləyin.',
                ).catch(() => {});
                await this.telegramService.answerCallback(cb.id, '🚫 Avatar silindi, istifadəçiyə bildiriş göndərildi');
                await this.telegramService.editMessageCaption(
                    cb.message.chat.id, cb.message.message_id,
                    `${cb.message.caption || ''}\n\n🚫 <b>AVATAR SİLİNDİ (admin tərəfindən)</b>`,
                );
            }
            return { ok: true };
        }

        // ── Stadium approval callbacks ────────────────────────────
        const stadiumId = parts[1];
        if (!stadiumId) {
            await this.telegramService.answerCallback(cb.id, '❓ Bilinməyən əmr');
            return { ok: true };
        }

        if (action === 'approve') {
            await this.stadiumsService.approve(stadiumId, 'telegram-admin');
            await this.telegramService.answerCallback(cb.id, '✅ Stadion təsdiq edildi!');
            await this.telegramService.editMessage(
                cb.message.chat.id,
                cb.message.message_id,
                `${cb.message.text}\n\n✅ <b>TƏSDİQ EDİLDİ</b>`,
            );
        } else if (action === 'reject') {
            await this.stadiumsService.reject(stadiumId, 'Telegram vasitəsilə rədd edildi');
            await this.telegramService.answerCallback(cb.id, '❌ Stadion rədd edildi');
            await this.telegramService.editMessage(
                cb.message.chat.id,
                cb.message.message_id,
                `${cb.message.text}\n\n❌ <b>RƏD EDİLDİ</b>`,
            );
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
