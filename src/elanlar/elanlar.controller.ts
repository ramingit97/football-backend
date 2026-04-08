import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ElanlarService } from './elanlar.service';

@Controller('elanlar')
export class ElanlarController {
    constructor(private readonly elanlarService: ElanlarService) {}

    @Get()
    findAll() {
        return this.elanlarService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.elanlarService.findOne(id);
    }

    @Post()
    create(@Body() body: {
        creatorId: string;
        creatorName: string;
        creatorAvatar?: string;
        date: string;
        time?: string;
        timeOptions?: string[];
        format?: string;
        district?: string;
        metro?: string;
        description?: string;
    }) {
        return this.elanlarService.create(body);
    }

    @Post(':id/vote')
    vote(@Param('id') id: string, @Body() body: { userId: string; time: string }) {
        return this.elanlarService.vote(id, body.userId, body.time);
    }

    @Post(':id/smart-invite')
    smartInvite(@Param('id') id: string, @Body() body: { userId: string }) {
        return this.elanlarService.smartInvite(id, body.userId);
    }

    @Post(':id/interest')
    toggleInterest(
        @Param('id') id: string,
        @Body() body: { userId: string; name: string; avatar?: string },
    ) {
        return this.elanlarService.toggleInterest(id, { id: body.userId, name: body.name, avatar: body.avatar });
    }

    @Post(':id/convert')
    convert(@Param('id') id: string, @Body() body: { userId: string; gameId: string; gameTitle: string }) {
        return this.elanlarService.convert(id, body.userId, body.gameId, body.gameTitle);
    }

    @Delete(':id')
    cancel(@Param('id') id: string, @Body() body: { userId: string }) {
        return this.elanlarService.cancel(id, body.userId);
    }

    @Get(':id/messages')
    getMessages(@Param('id') id: string) {
        return this.elanlarService.getMessages(id);
    }
}
