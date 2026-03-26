import { Controller, Post, Get, Body, Query, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post('send')
    send(@Body() body: { userId: string; type: string; title: string; message: string; fcmToken?: string }) {
        return this.notificationsService.sendNotification(body.userId, body.type, body.title, body.message, body.fcmToken);
    }

    @Get('my')
    getMy(@Query('userId') userId: string) {
        return this.notificationsService.getMyNotifications(userId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
