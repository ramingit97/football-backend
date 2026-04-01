import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) {}

    @Post()
    create(@Body() body: { userId: string; userName: string; userEmail?: string; message: string }) {
        return this.supportService.create(body.userId, body.userName, body.userEmail || '', body.message);
    }

    @Get('my')
    findByUser(@Query('userId') userId: string) {
        return this.supportService.findByUser(userId);
    }

    @Get('admin/all')
    findAll() {
        return this.supportService.findAll();
    }

    @Get('admin/open')
    findOpen() {
        return this.supportService.findOpen();
    }

    @Post(':id/reply')
    reply(@Param('id') id: string, @Body('reply') reply: string) {
        return this.supportService.reply(id, reply);
    }
}
