import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
    constructor(private readonly lookupService: LookupService) {}

    @Get()
    findAll(
        @Query('format') format?: string,
        @Query('district') district?: string,
        @Query('status') status?: string,
    ) {
        return this.lookupService.findAll({ format, district, status });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.lookupService.findOne(id);
    }

    @Post()
    create(@Body() body: {
        creatorId: string;
        creatorName: string;
        creatorAvatar?: string;
        contactPhone?: string;
        teamId?: string;
        teamName?: string;
        format: string;
        playerCount?: number;
        preferredDate?: string;
        preferredTime?: string;
        district?: string;
        message?: string;
    }) {
        return this.lookupService.create(body);
    }

    @Post(':id/respond')
    respond(@Param('id') id: string, @Body() body: {
        userId: string;
        userName: string;
        userAvatar?: string;
        teamId?: string;
        teamName?: string;
        message?: string;
        contactPhone?: string;
    }) {
        return this.lookupService.respond(id, body);
    }

    @Post(':id/messages')
    sendMessage(@Param('id') id: string, @Body() body: {
        userId: string;
        userName: string;
        userAvatar?: string;
        message: string;
    }) {
        return this.lookupService.sendMessage(id, body);
    }

    @Get(':id/messages')
    getMessages(@Param('id') id: string) {
        return this.lookupService.getMessages(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { userId: string; status: 'matched' | 'cancelled' }) {
        return this.lookupService.updateStatus(id, body.userId, body.status);
    }
}
