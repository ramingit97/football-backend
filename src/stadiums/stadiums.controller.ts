import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { StadiumsService } from './stadiums.service';
import { TelegramService } from './telegram.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';

@Controller('stadiums')
export class StadiumsController {
    constructor(
        private readonly stadiumsService: StadiumsService,
        private readonly telegramService: TelegramService,
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
    // ── Telegram webhook ──────────────────────────────────
    @Post('telegram-webhook')
    async telegramWebhook(@Body() body: any) {
        const cb = body?.callback_query;
        if (!cb) return { ok: true };

        const data: string = cb.data || '';
        const [action, stadiumId] = data.split('_');

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
