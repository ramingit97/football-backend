import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
    constructor(private readonly achievementsService: AchievementsService) {}

    @Post()
    create(@Body() data: any) {
        return this.achievementsService.create(data);
    }

    @Get('user/:userId')
    findByUser(@Param('userId') userId: string) {
        return this.achievementsService.findByUser(userId);
    }
}
