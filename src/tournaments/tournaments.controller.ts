import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Patch,
} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsGateway } from './tournaments.gateway';
import {
    CreateTournamentDto,
    RegisterTeamDto,
    AddSlotDto,
    EnterScoreDto,
    ProposeSlotDto,
    RespondSlotDto,
    WalkoverDto,
    AddRosterPlayerDto,
    ApproveClaimDto,
    EnterMatchStatsDto,
    MvpVoteDto,
} from './dto/tournaments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tournaments')
export class TournamentsController {
    constructor(
        private readonly tournamentsService: TournamentsService,
        private readonly gateway: TournamentsGateway,
    ) {}

    // ─── PUBLIC ENDPOINTS ──────────────────────────────────────────────────────

    @Get()
    findAll(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
    ) {
        return this.tournamentsService.findAll(+page, +limit, status);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tournamentsService.findOne(id);
    }

    @Get(':id/standings')
    getStandings(@Param('id') id: string) {
        return this.tournamentsService.getStandings(id);
    }

    @Get(':id/bracket')
    getBracket(@Param('id') id: string) {
        return this.tournamentsService.getBracket(id);
    }

    @Get(':id/slots')
    getSlots(@Param('id') id: string) {
        return this.tournamentsService.getSlots(id);
    }

    // ─── PROTECTED ENDPOINTS ───────────────────────────────────────────────────

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreateTournamentDto, @Request() req: any) {
        return this.tournamentsService.create(dto, req.user.userId);
    }

    @Post(':id/register')
    @UseGuards(JwtAuthGuard)
    registerTeam(
        @Param('id') tournamentId: string,
        @Body() dto: RegisterTeamDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.registerTeam(tournamentId, dto.teamId, req.user.userId);
    }

    @Delete(':id/unregister/:teamId')
    @UseGuards(JwtAuthGuard)
    unregisterTeam(
        @Param('id') tournamentId: string,
        @Param('teamId') teamId: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.unregisterTeam(tournamentId, teamId, req.user.userId);
    }

    @Post(':id/start-draw')
    @UseGuards(JwtAuthGuard)
    startGroupDraw(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.startGroupDraw(id, req.user.userId);
    }

    @Post(':id/start-playoff-draw')
    @UseGuards(JwtAuthGuard)
    startPlayoffDraw(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.startPlayoffDraw(id, req.user.userId);
    }

    @Post(':id/slots')
    @UseGuards(JwtAuthGuard)
    addSlot(
        @Param('id') tournamentId: string,
        @Body() dto: AddSlotDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.addSlot(tournamentId, dto, req.user.userId);
    }

    @Delete(':id/slots/:slotId')
    @UseGuards(JwtAuthGuard)
    deleteSlot(
        @Param('id') tournamentId: string,
        @Param('slotId') slotId: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.deleteSlot(tournamentId, slotId, req.user.userId);
    }

    @Post(':id/matches/:matchId/propose-slot')
    @UseGuards(JwtAuthGuard)
    proposeSlot(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: ProposeSlotDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.proposeSlot(tournamentId, matchId, dto.slotId, req.user.userId);
    }

    @Post(':id/matches/:matchId/respond-slot')
    @UseGuards(JwtAuthGuard)
    respondToSlot(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: RespondSlotDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.respondToSlot(tournamentId, matchId, req.user.userId, dto.accept);
    }

    @Post(':id/matches/:matchId/score')
    @UseGuards(JwtAuthGuard)
    enterScore(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: EnterScoreDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.enterScore(tournamentId, matchId, dto, req.user.userId);
    }

    @Post(':id/matches/:matchId/walkover')
    @UseGuards(JwtAuthGuard)
    assignWalkover(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: WalkoverDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.assignWalkover(tournamentId, matchId, dto.winnerTeamId, req.user.userId);
    }

    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.tournamentsService.cancel(id, req.user.userId);
    }

    // ─── SINGLE MATCH ─────────────────────────────────────────────────────────

    @Get(':id/matches/:matchId')
    getMatch(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
    ) {
        return this.tournamentsService.getMatch(tournamentId, matchId);
    }

    @Post(':id/matches/:matchId/stats')
    @UseGuards(JwtAuthGuard)
    enterMatchStats(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: EnterMatchStatsDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.enterMatchStats(tournamentId, matchId, req.user.userId, dto.playerStats);
    }

    @Post(':id/matches/:matchId/mvp-vote')
    @UseGuards(JwtAuthGuard)
    voteMvp(
        @Param('id') tournamentId: string,
        @Param('matchId') matchId: string,
        @Body() dto: MvpVoteDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.voteMvp(tournamentId, matchId, req.user.userId, dto.playerId);
    }

    // ─── TOURNAMENT STATS ─────────────────────────────────────────────────────

    @Get(':id/stats')
    getTournamentStats(@Param('id') id: string) {
        return this.tournamentsService.getTournamentStats(id);
    }

    // ─── ROSTER ───────────────────────────────────────────────────────────────

    @Get(':id/teams/:teamId/roster')
    getRoster(
        @Param('id') tournamentId: string,
        @Param('teamId') teamId: string,
    ) {
        return this.tournamentsService.getRoster(tournamentId, teamId);
    }

    @Post(':id/teams/:teamId/roster')
    @UseGuards(JwtAuthGuard)
    addRosterPlayer(
        @Param('id') tournamentId: string,
        @Param('teamId') teamId: string,
        @Body() dto: AddRosterPlayerDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.addRosterPlayer(tournamentId, teamId, dto, req.user.userId);
    }

    @Delete(':id/teams/:teamId/roster/:playerId')
    @UseGuards(JwtAuthGuard)
    removeRosterPlayer(
        @Param('id') tournamentId: string,
        @Param('teamId') teamId: string,
        @Param('playerId') playerId: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.removeRosterPlayer(tournamentId, teamId, playerId, req.user.userId);
    }

    @Post(':id/roster/:playerId/claim')
    @UseGuards(JwtAuthGuard)
    claimRosterPlayer(
        @Param('id') tournamentId: string,
        @Param('playerId') playerId: string,
        @Request() req: any,
    ) {
        return this.tournamentsService.claimRosterPlayer(tournamentId, playerId, req.user.userId);
    }

    @Post(':id/roster/:playerId/approve-claim')
    @UseGuards(JwtAuthGuard)
    approveRosterClaim(
        @Param('id') tournamentId: string,
        @Param('playerId') playerId: string,
        @Body() dto: ApproveClaimDto,
        @Request() req: any,
    ) {
        return this.tournamentsService.approveRosterClaim(tournamentId, playerId, dto.approve, req.user.userId);
    }
}
