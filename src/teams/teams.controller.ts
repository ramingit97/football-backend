import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, Query, Delete } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    create(@Body() createTeamDto: any) {
        console.log('Creating team:', createTeamDto);
        return this.teamsService.create(createTeamDto);
    }

    @Get()
    findAll(
        @Query('minRating') minRating?: string,
        @Query('maxRating') maxRating?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('sortBy') sortBy?: 'rating' | 'wins' | 'gamesPlayed',
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    ) {
        return this.teamsService.findAllFiltered({
            minRating: minRating ? parseInt(minRating, 10) : undefined,
            maxRating: maxRating ? parseInt(maxRating, 10) : undefined,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            sortBy,
            sortOrder,
        });
    }

    @Get('my')
    getMyTeams(@Query('userId') userId: string) {
        return this.teamsService.getMyTeams(userId);
    }

    @Get('requests/my')
    getMyRequests(@Request() req: any, @Query('userId') userId: string) {
        // Temporary: use query param if provided, otherwise fallback to req.user (if auth implemented)
        // Since auth guard isn't fully set up here yet, we rely on query param for now as per plan.
        return this.teamsService.getMyRequests(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.teamsService.findOne(id);
    }



    @Post(':id/join')
    join(@Param('id') id: string, @Body('userId') userId: string) {
        return this.teamsService.joinTeam(id, userId);
    }

    @Delete(':id/leave')
    leave(@Param('id') id: string, @Body('userId') userId: string) {
        return this.teamsService.leaveTeam(id, userId);
    }

    @Post(':id/join-request')
    requestJoin(@Param('id') id: string, @Body('userId') userId: string) {
        return this.teamsService.requestJoin(id, userId);
    }

    @Post(':id/invite')
    invitePlayer(@Param('id') id: string, @Body('userId') userId: string) {
        return this.teamsService.invitePlayer(id, userId);
    }

    @Get(':id/requests')
    getRequests(@Param('id') id: string) {
        return this.teamsService.getRequests(id);
    }



    @Post('requests/:requestId/respond')
    respondToRequest(
        @Param('requestId') requestId: string,
        @Body('status') status: 'approved' | 'rejected'
    ) {
        return this.teamsService.respondToRequest(requestId, status);
    }

    @Put(':id/captain')
    transferCaptain(
        @Param('id') id: string,
        @Body('newCaptainId') newCaptainId: string,
        @Body('currentUserId') currentUserId: string
    ) {
        return this.teamsService.transferCaptain(id, newCaptainId, currentUserId);
    }

    @Put(':id/formation')
    updateFormation(
        @Param('id') id: string,
        @Body('formation') formation: { playerId: string; position: string; x: number; y: number }[],
        @Body('currentUserId') currentUserId: string
    ) {
        return this.teamsService.updateFormation(id, formation, currentUserId);
    }

    @Put(':id/formation/:gameFormat')
    updateFormationByFormat(
        @Param('id') id: string,
        @Param('gameFormat') gameFormat: string,
        @Body('formationString') formationString: string,
        @Body('players') players: { playerId: string; position: string; x: number; y: number }[],
        @Body('currentUserId') currentUserId: string
    ) {
        return this.teamsService.updateFormationByFormat(id, gameFormat, formationString, players, currentUserId);
    }

    @Get(':id/formation/:gameFormat')
    getFormationByFormat(
        @Param('id') id: string,
        @Param('gameFormat') gameFormat: string
    ) {
        return this.teamsService.getFormationByFormat(id, gameFormat);
    }

    @Put(':id/flag')
    updateFlag(
        @Param('id') id: string,
        @Body('flagUrl') flagUrl: string,
        @Body('currentUserId') currentUserId: string
    ) {
        return this.teamsService.updateFlag(id, flagUrl, currentUserId);
    }

    @Put(':id/reserves')
    updateReservePlayers(
        @Param('id') id: string,
        @Body('reservePlayerIds') reservePlayerIds: string[],
        @Body('currentUserId') currentUserId: string
    ) {
        return this.teamsService.updateReservePlayers(id, reservePlayerIds, currentUserId);
    }

    @Post('match-result')
    updateMatchResult(
        @Body('winnerId') winnerId: string,
        @Body('loserId') loserId: string,
        @Body('isDraw') isDraw: boolean
    ) {
        return this.teamsService.updateStatsAfterMatch(winnerId, loserId, isDraw);
    }
}
