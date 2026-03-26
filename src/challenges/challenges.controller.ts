import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { ChallengesService } from './challenges.service';

@Controller('challenges')
export class ChallengesController {
    constructor(private readonly challengesService: ChallengesService) { }

    @Post()
    create(@Body() createChallengeDto: any) {
        return this.challengesService.create(createChallengeDto);
    }

    @Get('team/:teamId')
    findAllByTeam(@Param('teamId') teamId: string) {
        return this.challengesService.findAllByTeam(teamId);
    }

    @Put(':id/respond')
    respond(
        @Param('id') id: string,
        @Body('status') status: 'accepted' | 'rejected'
    ) {
        return this.challengesService.respond(id, status);
    }
}
