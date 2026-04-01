import { Controller, Get, Post, Body, Param, Put, Delete, Query, Patch } from '@nestjs/common';
import { GamesService } from './games.service';
import { Game } from './entities/game.entity';
import { FinishGameDto } from './dto/finish-game.dto';
import type { ReportType, ReportStatus } from './entities/player-report.entity';

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) { }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('format') format?: string,
        @Query('district') district?: string,
        @Query('metro') metro?: string,
    ) {
        return this.gamesService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 12,
            status,
            format,
            district,
            metro,
        );
    }

    @Get('nearby')
    findNearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius: number) {
        return this.gamesService.findNearby(lat, lng, radius);
    }

    @Get('hot')
    getHotGames() {
        return this.gamesService.getHotGames();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.gamesService.findOne(id);
    }

    @Get('team/:teamId')
    findByTeam(@Param('teamId') teamId: string) {
        return this.gamesService.findByTeam(teamId);
    }

    @Post()
    create(@Body() gameData: Partial<Game>) {
        return this.gamesService.create(gameData);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() gameData: Partial<Game>) {
        return this.gamesService.update(id, gameData);
    }

    @Put(':id/urgent')
    setUrgent(@Param('id') id: string, @Body() body: { isUrgent: boolean }) {
        return this.gamesService.setUrgent(id, body.isUrgent);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.gamesService.delete(id);
    }

    @Post(':id/cancel')
    cancelGame(@Param('id') id: string, @Body() body: { organizerId: string; reason?: string }) {
        return this.gamesService.cancelGame(id, body.organizerId, body.reason);
    }

    @Post(':id/join')
    joinGame(@Param('id') id: string, @Body() body: any) {
        const { referredBy, ...player } = body;
        return this.gamesService.joinGame(id, player, referredBy);
    }

    @Post(':id/finish')
    finishGame(@Param('id') id: string, @Body() finishData: FinishGameDto) {
        return this.gamesService.finishGame(id, finishData);
    }

    @Post(':id/leave')
    leaveGame(@Param('id') id: string, @Body() body: { playerId: string }) {
        return this.gamesService.leaveGame(id, body.playerId);
    }

    // ============ SMART INVITE FEATURE ============

    @Post(':id/smart-invite')
    smartInvite(@Param('id') id: string, @Body() filters: {
        skillLevel?: string;
        district?: string;
        minAge?: number;
        maxAge?: number;
        limit?: number;
    }) {
        return this.gamesService.smartInvite(id, filters);
    }

    @Post(':id/accept-invite')
    acceptInvite(@Param('id') id: string, @Body() body: { playerId: string }) {
        return this.gamesService.acceptInvite(id, body.playerId);
    }

    // ============ TEAM BALANCER FEATURE ============

    @Post(':id/balance-teams')
    balanceTeams(@Param('id') id: string) {
        return this.gamesService.balanceTeams(id);
    }

    // ============ PRIVATE GAME INVITES ============

    @Post(':id/private-invite')
    sendPrivateInvites(@Param('id') id: string, @Body() body: { playerIds: string[] }) {
        return this.gamesService.sendPrivateInvites(id, body.playerIds);
    }

    @Get(':id/invites')
    getGameInvites(@Param('id') id: string) {
        return this.gamesService.getGameInvites(id);
    }

    // Get all pending invitations for a user
    @Get('invitations/:userId')
    getUserInvitations(@Param('userId') userId: string) {
        return this.gamesService.getUserInvitations(userId);
    }

    // ============ POST-GAME PHASE FLOW ============

    // Step 1: Organizer enters score only
    @Post(':id/start-finish')
    startFinishGame(@Param('id') id: string, @Body() scoreData: { scoreTeamA: number; scoreTeamB: number }) {
        return this.gamesService.startFinishGame(id, scoreData);
    }

    // Step 2: Player claims their stats
    @Post(':id/claim-stats')
    claimStats(@Param('id') id: string, @Body() body: { playerId: string; goals: number; assists: number }) {
        return this.gamesService.claimStats(id, body.playerId, { goals: body.goals, assists: body.assists });
    }

    // Get pending stats for organizer review
    @Get(':id/pending-stats')
    getPendingStats(@Param('id') id: string) {
        return this.gamesService.getPendingStats(id);
    }

    // Step 3: Organizer validates stats
    @Post(':id/validate-stats')
    validateStats(@Param('id') id: string, @Body() body: { organizerId: string; stats: Array<{ playerId: string; goals: number; assists: number }> }) {
        return this.gamesService.validateStats(id, body.organizerId, body.stats);
    }

    // Step 4: Player casts MVP vote
    @Post(':id/cast-mvp-vote')
    castMvpVote(@Param('id') id: string, @Body() body: { voterId: string; votedPlayerId: string }) {
        return this.gamesService.castMvpVote(id, body.voterId, body.votedPlayerId);
    }

    // Step 5: Complete game (manual trigger or auto after voting ends)
    @Post(':id/complete')
    completeGame(@Param('id') id: string) {
        return this.gamesService.completeGame(id);
    }

    // ============ UNIFIED POST-GAME (SIMPLIFIED) ============
    @Post(':id/submit-postgame')
    submitPostGame(
        @Param('id') id: string,
        @Body() body: { playerId: string; goals: number; assists: number; mvpVoteId?: string }
    ) {
        return this.gamesService.submitPostGame(id, body.playerId, {
            goals: body.goals,
            assists: body.assists,
            mvpVoteId: body.mvpVoteId
        });
    }

    // ============ NO-SHOW SYSTEM ============

    @Post(':id/report-noshows')
    reportNoShows(
        @Param('id') id: string,
        @Body() body: { reportedByUserId: string; players: { id: string; name?: string }[] }
    ) {
        return this.gamesService.reportNoShows(id, body.reportedByUserId, body.players);
    }

    @Get('noshows/all')
    getAllNoShows(@Query('userId') userId?: string) {
        return this.gamesService.getNoShows(userId);
    }

    @Get('noshows/user/:userId')
    getUserNoShows(@Param('userId') userId: string) {
        return this.gamesService.getNoShows(userId);
    }

    // ============ PLAYER REPORTS ============

    @Post('reports')
    submitReport(@Body() body: {
        reporterId: string;
        reporterName?: string;
        reportedUserId: string;
        reportedUserName?: string;
        gameId?: string;
        type: ReportType;
        description?: string;
    }) {
        return this.gamesService.submitReport(body);
    }

    @Get('reports/all')
    getReports(@Query('status') status?: ReportStatus) {
        return this.gamesService.getReports(status);
    }

    @Patch('reports/:id')
    updateReport(
        @Param('id') id: string,
        @Body() body: { status: ReportStatus; adminNote?: string }
    ) {
        return this.gamesService.updateReport(id, body);
    }
}
