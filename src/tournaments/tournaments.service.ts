import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentTeam } from './entities/tournament-team.entity';
import { TournamentMatch } from './entities/tournament-match.entity';
import { TournamentSlot } from './entities/tournament-slot.entity';
import { TournamentRosterPlayer } from './entities/tournament-roster-player.entity';
import {
    CreateTournamentDto,
    AddSlotDto,
    EnterScoreDto,
    AddRosterPlayerDto,
    ApproveClaimDto,
} from './dto/tournaments.dto';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TournamentsGateway } from './tournaments.gateway';

@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(TournamentTeam)
        private readonly teamRepo: Repository<TournamentTeam>,
        @InjectRepository(TournamentMatch)
        private readonly matchRepo: Repository<TournamentMatch>,
        @InjectRepository(TournamentSlot)
        private readonly slotRepo: Repository<TournamentSlot>,
        @InjectRepository(TournamentRosterPlayer)
        private readonly rosterRepo: Repository<TournamentRosterPlayer>,
        private readonly teamsService: TeamsService,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
        private readonly gateway: TournamentsGateway,
    ) {}

    // ─── CREATE ────────────────────────────────────────────────────────────────

    async create(dto: CreateTournamentDto, organizerId: string): Promise<Tournament> {
        if (dto.maxTeams !== 8 && dto.maxTeams !== 16) {
            throw new BadRequestException('maxTeams must be 8 or 16');
        }

        const PLATFORM_FEE = 5;

        // Deduct 5 AZN platform fee from organizer
        const organizer = await this.usersService.findOneById(organizerId);
        const balance = Number(organizer?.balance ?? 0);
        if (balance < PLATFORM_FEE) {
            throw new BadRequestException(
                `Недостаточно средств для создания турнира. Ваш баланс: ${balance.toFixed(2)} ₼, необходимо: ${PLATFORM_FEE} ₼`,
            );
        }
        await this.usersService.updateBalance(organizerId, -PLATFORM_FEE);

        // Auto-calculate prize pool from entry fee × max teams if not explicitly provided
        const computedPrizePool = Number(dto.prizePool) > 0
            ? Number(dto.prizePool)
            : Number(dto.entryFee) * Number(dto.maxTeams);

        const tournament = this.tournamentRepo.create({
            ...dto,
            organizerId,
            organizerName: organizer?.name || 'Организатор',
            prizePool: computedPrizePool,
            prize1Percent: dto.prize1Percent ?? 60,
            prize2Percent: dto.prize2Percent ?? 20,
            prize3Percent: dto.prize3Percent ?? 5,
            registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : null,
            groupStageDeadline: dto.groupStageDeadline ? new Date(dto.groupStageDeadline) : null,
            playoffDeadline: dto.playoffDeadline ? new Date(dto.playoffDeadline) : null,
            status: 'registration',
        });

        return this.tournamentRepo.save(tournament);
    }

    // ─── LIST ──────────────────────────────────────────────────────────────────

    async findAll(page = 1, limit = 20, status?: string): Promise<{ tournaments: Tournament[]; total: number }> {
        const where: any = {};
        if (status) where.status = status;

        const [tournaments, total] = await this.tournamentRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { tournaments, total };
    }

    // ─── DETAIL ────────────────────────────────────────────────────────────────

    async findOne(id: string): Promise<any> {
        const tournament = await this.tournamentRepo.findOne({
            where: { id },
            relations: ['teams', 'matches', 'slots'],
        });
        if (!tournament) throw new NotFoundException('Tournament not found');

        const standings = await this.calculateGroupStandings(id);
        const bracket = await this.getBracketData(id);

        return { ...tournament, standings, bracket };
    }

    // ─── REGISTER TEAM ─────────────────────────────────────────────────────────

    async registerTeam(tournamentId: string, teamId: string, captainId: string): Promise<TournamentTeam> {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['teams'],
        });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.status !== 'registration') {
            throw new BadRequestException('Registration is closed');
        }
        if (tournament.teams.length >= tournament.maxTeams) {
            throw new BadRequestException('Tournament is full');
        }

        // Verify captain owns this team
        const team = await this.teamsService.findOne(teamId);
        if (team.captainId !== captainId) {
            throw new ForbiddenException('Only the captain can register the team');
        }

        // Check minimum players requirement derived from tournament format (e.g. '6x6' → 6)
        const minPlayers = parseInt(tournament.format.split('x')[0], 10) || 5;
        const currentPlayerCount = (team.playerIds || []).length;
        if (currentPlayerCount < minPlayers) {
            throw new BadRequestException(
                `Команде нужно минимум ${minPlayers} игроков для участия в турнире формата ${tournament.format}. ` +
                `Сейчас в команде: ${currentPlayerCount} игрок(а).`,
            );
        }

        // Check not already registered
        const existing = await this.teamRepo.findOneBy({ tournamentId, teamId });
        if (existing) throw new BadRequestException('Team is already registered');

        // Entry fee is informational only — paid to organizer in cash outside the app
        const registration = this.teamRepo.create({
            tournamentId,
            teamId,
            captainId,
            teamName: team.name,
            teamLogo: team.logo || null,
            paymentStatus: 'pending', // organizer confirms cash payment separately
        });

        const saved = await this.teamRepo.save(registration);

        // Auto-close if full
        const updatedCount = tournament.teams.length + 1;
        if (updatedCount >= tournament.maxTeams) {
            await this.tournamentRepo.update(tournamentId, { status: 'registration' });
            this.gateway.emitToTournament(tournamentId, 'registrationFull', {
                message: 'Все места заняты! Жеребьёвка групп скоро начнётся.',
                teamCount: updatedCount,
            });
        } else {
            this.gateway.emitToTournament(tournamentId, 'teamRegistered', {
                team: saved,
                count: updatedCount,
                max: tournament.maxTeams,
            });
        }

        return saved;
    }

    // ─── UNREGISTER TEAM ───────────────────────────────────────────────────────

    async unregisterTeam(tournamentId: string, teamId: string, captainId: string): Promise<void> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.status !== 'registration') {
            throw new BadRequestException('Cannot unregister after draw has started');
        }

        const reg = await this.teamRepo.findOneBy({ tournamentId, teamId });
        if (!reg) throw new NotFoundException('Team is not registered');
        if (reg.captainId !== captainId) throw new ForbiddenException('Only captain can unregister');

        // No refund needed — entry fee is paid to organizer in cash outside the app
        await this.teamRepo.delete(reg.id);
    }

    // ─── START GROUP DRAW ──────────────────────────────────────────────────────

    async startGroupDraw(tournamentId: string, organizerId: string): Promise<any> {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['teams'],
        });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can start draw');
        if (tournament.status !== 'registration') {
            throw new BadRequestException('Tournament is not in registration phase');
        }

        const teams = tournament.teams;
        if (teams.length < 8) throw new BadRequestException('Minimum 8 teams required to start');
        if (teams.length % 4 !== 0) throw new BadRequestException('Team count must be a multiple of 4 (8 or 16)');

        const numGroups = teams.length / 4;
        const groupLetters = ['A', 'B', 'C', 'D'].slice(0, numGroups);

        // Shuffle teams randomly
        const shuffled = [...teams].sort(() => Math.random() - 0.5);

        // Assign groups (4 teams per group)
        const groups = groupLetters.map((letter, i) => ({
            id: letter,
            teams: shuffled.slice(i * 4, (i + 1) * 4),
        }));

        // Build draw sequence for frontend animation (interleaved: A B C D A B C D...)
        const drawSequence: any[] = [];
        let order = 1;
        for (let slot = 0; slot < 4; slot++) {
            for (const group of groups) {
                const team = group.teams[slot];
                if (team) {
                    drawSequence.push({
                        team: { name: team.teamName, logo: team.teamLogo, teamId: team.teamId },
                        group: group.id,
                        order: order++,
                    });
                }
            }
        }

        // Persist group assignments
        for (const group of groups) {
            for (const team of group.teams) {
                await this.teamRepo.update(team.id, { groupId: group.id });
            }
        }

        // Generate round-robin fixtures per group
        const deadline = tournament.groupStageDeadline || new Date(Date.now() + 14 * 24 * 3600 * 1000);
        for (const group of groups) {
            await this.generateGroupFixtures(group.id, group.teams, tournamentId, deadline);
        }

        // Update status
        await this.tournamentRepo.update(tournamentId, { status: 'group_stage' });

        // Build groups data for response
        const groupsData: Record<string, TournamentTeam[]> = {};
        for (const group of groups) {
            const updatedTeams = await this.teamRepo.find({ where: { tournamentId, groupId: group.id } });
            groupsData[group.id] = updatedTeams;
        }

        // Notify all captains that draw is live
        this.notifyDrawStarting(tournamentId, tournament.name, false).catch(() => {});

        // Emit live draw to all viewers
        this.gateway.emitToTournament(tournamentId, 'groupDrawComplete', {
            drawSequence,
            groups: groupsData,
        });

        return { drawSequence, groups: groupsData };
    }

    // ─── SLOTS ─────────────────────────────────────────────────────────────────

    async addSlot(tournamentId: string, dto: AddSlotDto, organizerId: string): Promise<TournamentSlot> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can add slots');
        if (tournament.status === 'completed' || tournament.status === 'cancelled') {
            throw new BadRequestException('Cannot add slots to a finished tournament');
        }

        const slot = this.slotRepo.create({ ...dto, tournamentId, status: 'available' });
        const saved = await this.slotRepo.save(slot);

        this.gateway.emitToTournament(tournamentId, 'slotAdded', { slot: saved });
        return saved;
    }

    async deleteSlot(tournamentId: string, slotId: string, organizerId: string): Promise<void> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can delete slots');

        const slot = await this.slotRepo.findOneBy({ id: slotId, tournamentId });
        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.status !== 'available') throw new BadRequestException('Cannot delete a reserved or confirmed slot');

        await this.slotRepo.delete(slotId);
    }

    // ─── SLOT PROPOSAL ─────────────────────────────────────────────────────────

    async proposeSlot(tournamentId: string, matchId: string, slotId: string, captainId: string): Promise<TournamentMatch> {
        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status !== 'scheduled') {
            throw new BadRequestException('Match already has a slot or is completed');
        }

        const [homeTeam, awayTeam] = await Promise.all([
            this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId }),
            this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId }),
        ]);

        if (homeTeam?.captainId !== captainId && awayTeam?.captainId !== captainId) {
            throw new ForbiddenException('Only match participants can propose a slot');
        }

        const slot = await this.slotRepo.findOneBy({ id: slotId, tournamentId });
        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.status !== 'available') throw new BadRequestException('This slot is not available');

        // Reserve slot for 12 hours
        await this.slotRepo.update(slotId, {
            status: 'reserved',
            reservedForMatchId: matchId,
            reservedAt: new Date(),
        });

        match.pendingSlotId = slotId;
        match.pendingSlotProposedBy = captainId;
        match.status = 'slot_pending';
        await this.matchRepo.save(match);

        // Notify the opposing captain
        const otherTeam = homeTeam?.captainId === captainId ? awayTeam : homeTeam;
        if (otherTeam) {
            await this.notificationsService.sendNotification(
                otherTeam.captainId,
                'SLOT_PROPOSED',
                'SLOT_PROPOSED',
                'SLOT_PROPOSED',
                undefined,
                { tournamentId, matchId, slotId, date: slot.date, time: slot.startTime, stadium: slot.stadiumName },
            );
        }

        this.gateway.emitToTournament(tournamentId, 'matchUpdated', { match });
        return match;
    }

    async respondToSlot(
        tournamentId: string,
        matchId: string,
        captainId: string,
        accept: boolean,
    ): Promise<TournamentMatch> {
        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status !== 'slot_pending') throw new BadRequestException('No pending slot proposal for this match');
        if (match.pendingSlotProposedBy === captainId) {
            throw new ForbiddenException('Cannot confirm your own slot proposal');
        }

        const [homeTeam, awayTeam] = await Promise.all([
            this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId }),
            this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId }),
        ]);

        if (homeTeam?.captainId !== captainId && awayTeam?.captainId !== captainId) {
            throw new ForbiddenException('Only match participants can respond to slot proposals');
        }

        if (accept) {
            const slot = await this.slotRepo.findOneBy({ id: match.pendingSlotId });
            if (!slot) throw new NotFoundException('Proposed slot no longer exists');

            await this.slotRepo.update(slot.id, { status: 'confirmed' });

            const proposedBy = match.pendingSlotProposedBy;
            match.slotId = match.pendingSlotId;
            match.scheduledAt = new Date(`${slot.date}T${slot.startTime}`);
            match.status = 'confirmed';
            match.pendingSlotId = null;
            match.pendingSlotProposedBy = null;
            await this.matchRepo.save(match);
            if (proposedBy) {
                await this.notificationsService.sendNotification(
                    proposedBy,
                    'SLOT_CONFIRMED',
                    'SLOT_CONFIRMED',
                    'SLOT_CONFIRMED',
                    undefined,
                    { tournamentId, matchId, date: slot.date, time: slot.startTime },
                );
            }
        } else {
            // Release slot back to available
            if (match.pendingSlotId) {
                await this.slotRepo.update(match.pendingSlotId, {
                    status: 'available',
                    reservedForMatchId: null,
                    reservedAt: null,
                });
            }
            match.pendingSlotId = null;
            match.pendingSlotProposedBy = null;
            match.status = 'scheduled';
            await this.matchRepo.save(match);
        }

        this.gateway.emitToTournament(tournamentId, 'matchUpdated', { match });
        return match;
    }

    // ─── ENTER SCORE ───────────────────────────────────────────────────────────

    async enterScore(
        tournamentId: string,
        matchId: string,
        dto: EnterScoreDto,
        requesterId: string,
    ): Promise<TournamentMatch> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');

        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status === 'played') throw new BadRequestException('Match result already entered');

        const [homeTeam, awayTeam] = await Promise.all([
            this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId }),
            this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId }),
        ]);

        const isOrganizer = tournament.organizerId === requesterId;
        const isCaptain = homeTeam?.captainId === requesterId || awayTeam?.captainId === requesterId;
        if (!isOrganizer && !isCaptain) throw new ForbiddenException('Not authorized to enter score');

        const { homeScore, awayScore, winnerId } = dto;

        let actualWinnerId: string | null = null;
        let homePoints = 0;
        let awayPoints = 0;

        if (match.stage === 'group') {
            if (homeScore > awayScore) {
                actualWinnerId = match.homeTeamId;
                homePoints = 3;
            } else if (awayScore > homeScore) {
                actualWinnerId = match.awayTeamId;
                awayPoints = 3;
            } else {
                homePoints = 1;
                awayPoints = 1;
            }
        } else {
            // Playoff — draws go to penalty shootout
            if (homeScore > awayScore) {
                actualWinnerId = match.homeTeamId;
            } else if (awayScore > homeScore) {
                actualWinnerId = match.awayTeamId;
            } else if (winnerId) {
                actualWinnerId = winnerId;
            } else {
                throw new BadRequestException('Playoff draw: provide winnerId for penalty shootout winner');
            }
        }

        match.homeScore = homeScore;
        match.awayScore = awayScore;
        match.winnerId = actualWinnerId;
        match.status = 'played';
        await this.matchRepo.save(match);

        if (match.stage === 'group') {
            await this.applyMatchResult(tournamentId, match.homeTeamId, match.awayTeamId, homeScore, awayScore, homePoints, awayPoints);

            const isComplete = await this.checkGroupStageComplete(tournamentId);
            if (isComplete) {
                await this.tournamentRepo.update(tournamentId, { status: 'playoff_draw' });
                this.gateway.emitToTournament(tournamentId, 'groupStageComplete', {
                    message: 'Групповой этап завершён! Жеребьёвка плей-офф скоро начнётся.',
                });
            }
        } else {
            // Playoff: eliminate loser, advance winner
            const loserId = actualWinnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
            await this.teamRepo.update({ tournamentId, teamId: loserId }, { eliminated: true });

            const winnerReg = actualWinnerId === match.homeTeamId ? homeTeam : awayTeam;
            const totalTeams = await this.teamRepo.count({ where: { tournamentId } });
            const isFinal = this.isFinalBracketPosition(match.bracketPosition, totalTeams);

            if (isFinal) {
                if (winnerReg) await this.completeTournament(tournamentId, winnerReg, tournament.name);
            } else {
                if (winnerReg) await this.advanceInBracket(match, winnerReg, totalTeams);
            }
        }

        const standings = await this.calculateGroupStandings(tournamentId);
        this.gateway.emitToTournament(tournamentId, 'matchUpdated', { match, standings });

        return match;
    }

    // ─── WALKOVER ──────────────────────────────────────────────────────────────

    async assignWalkover(
        tournamentId: string,
        matchId: string,
        winnerTeamId: string,
        organizerId: string,
    ): Promise<TournamentMatch> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can assign walkovers');

        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status === 'played') throw new BadRequestException('Match already has a result');

        const isHome = match.homeTeamId === winnerTeamId;
        const isAway = match.awayTeamId === winnerTeamId;
        if (!isHome && !isAway) throw new BadRequestException('Winner must be one of the match teams');

        match.status = isHome ? 'walkover_home' : 'walkover_away';
        match.winnerId = winnerTeamId;
        match.homeScore = isHome ? 3 : 0;
        match.awayScore = isAway ? 3 : 0;
        await this.matchRepo.save(match);

        if (match.stage === 'group') {
            const homePoints = isHome ? 3 : 0;
            const awayPoints = isAway ? 3 : 0;
            await this.applyMatchResult(tournamentId, match.homeTeamId, match.awayTeamId, match.homeScore, match.awayScore, homePoints, awayPoints);

            const isComplete = await this.checkGroupStageComplete(tournamentId);
            if (isComplete) {
                await this.tournamentRepo.update(tournamentId, { status: 'playoff_draw' });
                this.gateway.emitToTournament(tournamentId, 'groupStageComplete', {
                    message: 'Групповой этап завершён! Жеребьёвка плей-офф скоро начнётся.',
                });
            }
        } else {
            const loserId = winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
            await this.teamRepo.update({ tournamentId, teamId: loserId }, { eliminated: true });

            const [homeTeam, awayTeam] = await Promise.all([
                this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId }),
                this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId }),
            ]);
            const winnerReg = isHome ? homeTeam : awayTeam;
            const totalTeams = await this.teamRepo.count({ where: { tournamentId } });
            const isFinal = this.isFinalBracketPosition(match.bracketPosition, totalTeams);

            if (isFinal) {
                if (winnerReg) await this.completeTournament(tournamentId, winnerReg, tournament.name);
            } else {
                if (winnerReg) await this.advanceInBracket(match, winnerReg, totalTeams);
            }
        }

        const standings = await this.calculateGroupStandings(tournamentId);
        this.gateway.emitToTournament(tournamentId, 'matchUpdated', { match, standings });
        return match;
    }

    // ─── START PLAYOFF DRAW ────────────────────────────────────────────────────

    async startPlayoffDraw(tournamentId: string, organizerId: string): Promise<any> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can start playoff draw');
        if (tournament.status !== 'playoff_draw') {
            throw new BadRequestException('Group stage is not complete yet');
        }

        const standings = await this.calculateGroupStandings(tournamentId);
        if (standings.some(g => g.teams.length < 2)) {
            throw new BadRequestException('Not enough teams with standings to generate bracket');
        }

        const advancing = standings.map(g => ({
            first: g.teams[0],
            second: g.teams[1],
        }));

        const deadline = tournament.playoffDeadline || new Date(Date.now() + 14 * 24 * 3600 * 1000);
        const bracketMatches = await this.generatePlayoffBracket(advancing, tournamentId, deadline);

        await this.tournamentRepo.update(tournamentId, { status: 'playoff' });

        // Build draw sequence for animation
        const seededMatches = bracketMatches.filter(
            m => m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD',
        );
        const drawSequence: any[] = [];
        seededMatches.forEach((m, i) => {
            drawSequence.push({ team: { name: m.homeTeamName, logo: m.homeTeamLogo }, position: m.bracketPosition, side: 'home', order: i * 2 + 1 });
            drawSequence.push({ team: { name: m.awayTeamName, logo: m.awayTeamLogo }, position: m.bracketPosition, side: 'away', order: i * 2 + 2 });
        });

        // Notify all captains
        this.notifyDrawStarting(tournamentId, tournament.name, true).catch(() => {});

        this.gateway.emitToTournament(tournamentId, 'playoffDrawComplete', {
            drawSequence,
            bracket: bracketMatches,
        });

        return { drawSequence, bracket: bracketMatches };
    }

    // ─── GET STANDINGS ─────────────────────────────────────────────────────────

    async getStandings(tournamentId: string): Promise<any[]> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        return this.calculateGroupStandings(tournamentId);
    }

    // ─── GET BRACKET ───────────────────────────────────────────────────────────

    async getBracket(tournamentId: string): Promise<any[]> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) throw new NotFoundException('Tournament not found');
        return this.getBracketData(tournamentId);
    }

    // ─── GET SLOTS ─────────────────────────────────────────────────────────────

    async getSlots(tournamentId: string): Promise<TournamentSlot[]> {
        return this.slotRepo.find({
            where: { tournamentId },
            order: { date: 'ASC', startTime: 'ASC' },
        });
    }

    // ─── CANCEL ────────────────────────────────────────────────────────────────

    async cancel(tournamentId: string, organizerId: string): Promise<Tournament> {
        const tournament = await this.tournamentRepo.findOne({
            where: { id: tournamentId },
            relations: ['teams'],
        });
        if (!tournament) throw new NotFoundException('Tournament not found');
        if (tournament.organizerId !== organizerId) throw new ForbiddenException('Only organizer can cancel');
        if (tournament.status === 'completed') throw new BadRequestException('Cannot cancel a completed tournament');

        // No refund needed — entry fees are paid to organizer in cash outside the app
        {
        }

        await this.tournamentRepo.update(tournamentId, { status: 'cancelled' });
        tournament.status = 'cancelled';

        this.gateway.emitToTournament(tournamentId, 'tournamentCancelled', { tournamentId });
        return tournament;
    }

    // ─── PRIVATE HELPERS ───────────────────────────────────────────────────────

    private async generateGroupFixtures(
        groupId: string,
        teams: TournamentTeam[],
        tournamentId: string,
        deadline: Date,
    ): Promise<void> {
        const n = teams.length;
        const schedule = [...teams];
        const fixtures: { home: TournamentTeam; away: TournamentTeam; matchday: number }[] = [];

        // Standard round-robin rotation algorithm (fix position 0, rotate rest)
        for (let round = 0; round < n - 1; round++) {
            for (let i = 0; i < n / 2; i++) {
                fixtures.push({ home: schedule[i], away: schedule[n - 1 - i], matchday: round + 1 });
            }
            // Rotate: keep index 0 fixed, rotate the rest
            const last = schedule.splice(n - 1, 1)[0];
            schedule.splice(1, 0, last);
        }

        const matches = fixtures.map(f =>
            this.matchRepo.create({
                tournamentId,
                stage: 'group',
                groupId,
                homeTeamId: f.home.teamId,
                homeTeamName: f.home.teamName,
                homeTeamLogo: f.home.teamLogo || null,
                awayTeamId: f.away.teamId,
                awayTeamName: f.away.teamName,
                awayTeamLogo: f.away.teamLogo || null,
                status: 'scheduled',
                matchday: f.matchday,
                deadlineAt: deadline,
            }),
        );

        await this.matchRepo.save(matches);
    }

    private async applyMatchResult(
        tournamentId: string,
        homeTeamId: string,
        awayTeamId: string,
        homeScore: number,
        awayScore: number,
        homePoints: number,
        awayPoints: number,
    ): Promise<void> {
        const [home, away] = await Promise.all([
            this.teamRepo.findOneBy({ tournamentId, teamId: homeTeamId }),
            this.teamRepo.findOneBy({ tournamentId, teamId: awayTeamId }),
        ]);

        if (home) {
            home.matchesPlayed += 1;
            home.goalsFor += homeScore;
            home.goalsAgainst += awayScore;
            home.points += homePoints;
            if (homePoints === 3) home.wins += 1;
            else if (homePoints === 1) home.draws += 1;
            else home.losses += 1;
            await this.teamRepo.save(home);
        }

        if (away) {
            away.matchesPlayed += 1;
            away.goalsFor += awayScore;
            away.goalsAgainst += homeScore;
            away.points += awayPoints;
            if (awayPoints === 3) away.wins += 1;
            else if (awayPoints === 1) away.draws += 1;
            else away.losses += 1;
            await this.teamRepo.save(away);
        }
    }

    private async checkGroupStageComplete(tournamentId: string): Promise<boolean> {
        const groupMatches = await this.matchRepo.find({ where: { tournamentId, stage: 'group' } });
        return groupMatches.every(m =>
            m.status === 'played' || m.status === 'walkover_home' || m.status === 'walkover_away',
        );
    }

    private async calculateGroupStandings(tournamentId: string): Promise<any[]> {
        const allTeams = await this.teamRepo.find({ where: { tournamentId } });
        const groups = [...new Set(allTeams.map(t => t.groupId).filter(Boolean))] as string[];

        return groups.sort().map(groupId => ({
            groupId,
            teams: allTeams
                .filter(t => t.groupId === groupId)
                .sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    const gdB = b.goalsFor - b.goalsAgainst;
                    const gdA = a.goalsFor - a.goalsAgainst;
                    if (gdB !== gdA) return gdB - gdA;
                    return b.goalsFor - a.goalsFor;
                }),
        }));
    }

    private async getBracketData(tournamentId: string): Promise<any[]> {
        const playoffMatches = await this.matchRepo.find({
            where: [
                { tournamentId, stage: 'quarterfinal' },
                { tournamentId, stage: 'semifinal' },
                { tournamentId, stage: 'final' },
            ],
            order: { bracketPosition: 'ASC' },
        });

        const stages = ['quarterfinal', 'semifinal', 'final'];
        return stages.map(stage => ({
            stage,
            matches: playoffMatches.filter(m => m.stage === stage),
        })).filter(s => s.matches.length > 0);
    }

    private async generatePlayoffBracket(
        advancing: { first: TournamentTeam; second: TournamentTeam }[],
        tournamentId: string,
        deadline: Date,
    ): Promise<TournamentMatch[]> {
        const toCreate: Partial<TournamentMatch>[] = [];

        if (advancing.length === 2) {
            // 4 teams → SF (pos 1,2) + Final (pos 3)
            const [grpA, grpB] = advancing;
            toCreate.push(
                { tournamentId, stage: 'semifinal', bracketPosition: 1, homeTeamId: grpA.first.teamId, homeTeamName: grpA.first.teamName, homeTeamLogo: grpA.first.teamLogo, awayTeamId: grpB.second.teamId, awayTeamName: grpB.second.teamName, awayTeamLogo: grpB.second.teamLogo, status: 'scheduled', deadlineAt: deadline },
                { tournamentId, stage: 'semifinal', bracketPosition: 2, homeTeamId: grpB.first.teamId, homeTeamName: grpB.first.teamName, homeTeamLogo: grpB.first.teamLogo, awayTeamId: grpA.second.teamId, awayTeamName: grpA.second.teamName, awayTeamLogo: grpA.second.teamLogo, status: 'scheduled', deadlineAt: deadline },
                { tournamentId, stage: 'final', bracketPosition: 3, homeTeamId: 'TBD', homeTeamName: '?', awayTeamId: 'TBD', awayTeamName: '?', status: 'scheduled', deadlineAt: deadline },
            );
        } else if (advancing.length === 4) {
            // 8 teams → QF (pos 1-4) + SF (pos 5-6) + Final (pos 7)
            const [grpA, grpB, grpC, grpD] = advancing;
            const qfs = [
                { home: grpA.first, away: grpB.second },
                { home: grpC.first, away: grpD.second },
                { home: grpB.first, away: grpA.second },
                { home: grpD.first, away: grpC.second },
            ];
            qfs.forEach((qf, i) => {
                toCreate.push({
                    tournamentId, stage: 'quarterfinal', bracketPosition: i + 1,
                    homeTeamId: qf.home.teamId, homeTeamName: qf.home.teamName, homeTeamLogo: qf.home.teamLogo,
                    awayTeamId: qf.away.teamId, awayTeamName: qf.away.teamName, awayTeamLogo: qf.away.teamLogo,
                    status: 'scheduled', deadlineAt: deadline,
                });
            });
            [5, 6].forEach(pos => {
                toCreate.push({ tournamentId, stage: 'semifinal', bracketPosition: pos, homeTeamId: 'TBD', homeTeamName: '?', awayTeamId: 'TBD', awayTeamName: '?', status: 'scheduled', deadlineAt: deadline });
            });
            toCreate.push({ tournamentId, stage: 'final', bracketPosition: 7, homeTeamId: 'TBD', homeTeamName: '?', awayTeamId: 'TBD', awayTeamName: '?', status: 'scheduled', deadlineAt: deadline });
        }

        return this.matchRepo.save(toCreate.map(m => this.matchRepo.create(m as TournamentMatch)));
    }

    private isFinalBracketPosition(pos: number, totalTeams: number): boolean {
        if (totalTeams <= 8) return pos === 3;
        return pos === 7;
    }

    private async advanceInBracket(match: TournamentMatch, winner: TournamentTeam, totalTeams: number): Promise<void> {
        const pos = match.bracketPosition;
        if (!pos) return;

        let nextPos: number;
        let side: 'home' | 'away';

        if (totalTeams <= 8) {
            // SF positions 1,2 → Final position 3
            nextPos = 3;
            side = pos === 1 ? 'home' : 'away';
        } else {
            // QF positions 1-4 → SF positions 5,6; SF 5,6 → Final 7
            if (pos <= 2) { nextPos = 5; side = pos === 1 ? 'home' : 'away'; }
            else if (pos <= 4) { nextPos = 6; side = pos === 3 ? 'home' : 'away'; }
            else { nextPos = 7; side = pos === 5 ? 'home' : 'away'; }
        }

        const nextMatch = await this.matchRepo.findOneBy({ tournamentId: match.tournamentId, bracketPosition: nextPos });
        if (!nextMatch) return;

        if (side === 'home') {
            nextMatch.homeTeamId = winner.teamId;
            nextMatch.homeTeamName = winner.teamName;
            nextMatch.homeTeamLogo = winner.teamLogo || null;
        } else {
            nextMatch.awayTeamId = winner.teamId;
            nextMatch.awayTeamName = winner.teamName;
            nextMatch.awayTeamLogo = winner.teamLogo || null;
        }

        await this.matchRepo.save(nextMatch);

        this.gateway.emitToTournament(match.tournamentId, 'teamAdvanced', {
            team: { id: winner.teamId, name: winner.teamName, logo: winner.teamLogo },
            fromPosition: pos,
            toPosition: nextPos,
            side,
        });
    }

    private async completeTournament(tournamentId: string, winnerReg: TournamentTeam, tournamentName: string): Promise<void> {
        const tournament = await this.tournamentRepo.findOneBy({ id: tournamentId });
        if (!tournament) return;

        const prizePool = Number(tournament.prizePool);
        if (prizePool > 0) {
            await this.usersService.updateBalance(winnerReg.captainId, prizePool).catch(() => null);
        }

        // Apply champion badge to all team members
        try {
            const team = await this.teamsService.findOne(winnerReg.teamId);
            for (const playerId of team.playerIds) {
                await this.usersService.applyBadges(playerId, { tournament_champion: 1 }).catch(() => null);
                await this.notificationsService.sendNotification(
                    playerId,
                    'TOURNAMENT_CHAMPION',
                    '🏆 Вы Чемпионы!',
                    `Команда «${winnerReg.teamName}» стала чемпионом турнира «${tournamentName}»!`,
                    undefined,
                    { tournamentId },
                );
            }
        } catch (_) {}

        await this.tournamentRepo.update(tournamentId, { status: 'completed' });

        this.gateway.emitToTournament(tournamentId, 'tournamentComplete', {
            winner: winnerReg,
            tournamentName,
        });
    }

    // ─── NOTIFY CAPTAINS ABOUT DRAW ────────────────────────────────────────────

    private async notifyDrawStarting(tournamentId: string, tournamentName: string, isPlayoff = false): Promise<void> {
        const teams = await this.teamRepo.find({ where: { tournamentId } });
        const title = isPlayoff ? '🔥 Жеребьёвка плей-офф!' : '🎲 Жеребьёвка групп начинается!';
        const body = isPlayoff
            ? `Жеребьёвка плей-офф турнира «${tournamentName}» началась. Смотрите в прямом эфире!`
            : `Жеребьёвка групп турнира «${tournamentName}» началась. Смотрите в прямом эфире!`;

        for (const team of teams) {
            try {
                await this.notificationsService.sendNotification(
                    team.captainId, 'DRAW_STARTED', title, body,
                    undefined, { tournamentId },
                );
            } catch (_) {}
        }
    }

    // ─── ROSTER ────────────────────────────────────────────────────────────────

    async getRoster(tournamentId: string, tournamentTeamId: string): Promise<TournamentRosterPlayer[]> {
        return this.rosterRepo.find({ where: { tournamentId, tournamentTeamId } });
    }

    async addRosterPlayer(
        tournamentId: string,
        tournamentTeamId: string,
        dto: AddRosterPlayerDto,
        captainId: string,
    ): Promise<TournamentRosterPlayer> {
        const tournamentTeam = await this.teamRepo.findOneBy({ id: tournamentTeamId, tournamentId });
        if (!tournamentTeam) throw new NotFoundException('Team not found in this tournament');
        if (tournamentTeam.captainId !== captainId) throw new ForbiddenException('Only the captain can manage the roster');

        const existing = await this.rosterRepo.count({ where: { tournamentTeamId } });
        if (existing >= 25) throw new BadRequestException('Roster limit is 25 players');

        const player = this.rosterRepo.create({
            tournamentId,
            tournamentTeamId,
            teamId: tournamentTeam.teamId,
            name: dto.name,
            number: dto.number ?? null,
            position: dto.position ?? null,
            userId: dto.userId ?? null,
            claimStatus: dto.userId ? 'claimed' : 'none',
        });

        const saved = await this.rosterRepo.save(player);
        this.gateway.emitToTournament(tournamentId, 'rosterUpdated', { tournamentTeamId });
        return saved;
    }

    async removeRosterPlayer(
        tournamentId: string,
        tournamentTeamId: string,
        playerId: string,
        captainId: string,
    ): Promise<void> {
        const tournamentTeam = await this.teamRepo.findOneBy({ id: tournamentTeamId, tournamentId });
        if (!tournamentTeam) throw new NotFoundException('Team not found');
        if (tournamentTeam.captainId !== captainId) throw new ForbiddenException('Only the captain can manage the roster');

        await this.rosterRepo.delete({ id: playerId, tournamentTeamId });
        this.gateway.emitToTournament(tournamentId, 'rosterUpdated', { tournamentTeamId });
    }

    // Player claims a roster slot ("это я")
    async claimRosterPlayer(
        tournamentId: string,
        playerId: string,
        userId: string,
    ): Promise<TournamentRosterPlayer> {
        const player = await this.rosterRepo.findOneBy({ id: playerId, tournamentId });
        if (!player) throw new NotFoundException('Player not found');
        if (player.userId) throw new BadRequestException('This player is already linked to an account');
        if (player.claimStatus === 'pending') throw new BadRequestException('A claim is already pending for this player');

        // Check user isn't already in this team's roster
        const alreadyLinked = await this.rosterRepo.findOneBy({ tournamentTeamId: player.tournamentTeamId, userId });
        if (alreadyLinked) throw new BadRequestException('You are already in this team\'s roster');

        const user = await this.usersService.findOneById(userId);
        await this.rosterRepo.update(playerId, {
            claimStatus: 'pending',
            pendingClaimUserId: userId,
            pendingClaimUserName: user?.name || user?.email || 'Unknown',
        });

        // Notify captain
        const team = await this.teamRepo.findOneBy({ id: player.tournamentTeamId });
        if (team) {
            await this.notificationsService.sendNotification(
                team.captainId,
                'ROSTER_CLAIM',
                '👤 Игрок хочет подтвердить профиль',
                `${user?.name || 'Игрок'} утверждает, что является «${player.name}» в вашей команде. Подтвердите или отклоните.`,
                undefined,
                { tournamentId, playerId, tournamentTeamId: player.tournamentTeamId },
            );
        }

        return this.rosterRepo.findOneBy({ id: playerId });
    }

    // Captain approves/rejects a claim
    async approveRosterClaim(
        tournamentId: string,
        playerId: string,
        approve: boolean,
        captainId: string,
    ): Promise<TournamentRosterPlayer> {
        const player = await this.rosterRepo.findOneBy({ id: playerId, tournamentId });
        if (!player) throw new NotFoundException('Player not found');
        if (player.claimStatus !== 'pending') throw new BadRequestException('No pending claim');

        const team = await this.teamRepo.findOneBy({ id: player.tournamentTeamId });
        if (!team || team.captainId !== captainId) throw new ForbiddenException('Only the captain can approve claims');

        if (approve) {
            await this.rosterRepo.update(playerId, {
                userId: player.pendingClaimUserId,
                claimStatus: 'claimed',
                pendingClaimUserId: null,
                pendingClaimUserName: null,
            });
            // Notify claimant
            await this.notificationsService.sendNotification(
                player.pendingClaimUserId,
                'ROSTER_CLAIM_APPROVED',
                '✅ Капитан подтвердил ваш профиль',
                `Вы теперь числитесь как «${player.name}» в команде «${team.teamName}».`,
                undefined,
                { tournamentId },
            );
        } else {
            await this.rosterRepo.update(playerId, {
                claimStatus: 'none',
                pendingClaimUserId: null,
                pendingClaimUserName: null,
            });
            // Notify claimant of rejection
            try {
                await this.notificationsService.sendNotification(
                    player.pendingClaimUserId,
                    'ROSTER_CLAIM_REJECTED',
                    '❌ Капитан отклонил заявку',
                    `Капитан не подтвердил вас как «${player.name}».`,
                    undefined,
                    { tournamentId },
                );
            } catch (_) {}
        }

        this.gateway.emitToTournament(tournamentId, 'rosterUpdated', { tournamentTeamId: player.tournamentTeamId });
        return this.rosterRepo.findOneBy({ id: playerId });
    }

    // ─── GET SINGLE MATCH ─────────────────────────────────────────────────────

    async getMatch(tournamentId: string, matchId: string): Promise<any> {
        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');

        const [homeRoster, awayRoster, slot] = await Promise.all([
            this.rosterRepo.find({ where: { tournamentId, teamId: match.homeTeamId } }),
            this.rosterRepo.find({ where: { tournamentId, teamId: match.awayTeamId } }),
            match.slotId ? this.slotRepo.findOneBy({ id: match.slotId }) : Promise.resolve(null),
        ]);

        return { ...match, homeRoster, awayRoster, slot };
    }

    // ─── ENTER MATCH STATS ────────────────────────────────────────────────────

    async enterMatchStats(
        tournamentId: string,
        matchId: string,
        captainId: string,
        playerStats: { playerId: string; goals: number; assists: number }[],
    ): Promise<any> {
        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status !== 'played') throw new BadRequestException('Stats can only be entered after the match is played');

        // Find which side this captain belongs to
        const homeTeam = await this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId });
        const awayTeam = await this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId });

        const isHomeCaptain = homeTeam?.captainId === captainId;
        const isAwayCaptain = awayTeam?.captainId === captainId;

        if (!isHomeCaptain && !isAwayCaptain) throw new ForbiddenException('Only a team captain in this match can enter stats');
        if (isHomeCaptain && match.homeStatsEntered) throw new BadRequestException('Stats already entered for your team');
        if (isAwayCaptain && match.awayStatsEntered) throw new BadRequestException('Stats already entered for your team');

        const teamId = isHomeCaptain ? match.homeTeamId : match.awayTeamId;

        for (const stat of playerStats) {
            const player = await this.rosterRepo.findOneBy({ id: stat.playerId, teamId, tournamentId });
            if (!player) continue;

            await this.rosterRepo.update(stat.playerId, {
                goals:         player.goals   + (stat.goals   || 0),
                assists:       player.assists  + (stat.assists || 0),
                matchesPlayed: player.matchesPlayed + 1,
            });
        }

        if (isHomeCaptain) {
            await this.matchRepo.update(matchId, { homeStatsEntered: true });
        } else {
            await this.matchRepo.update(matchId, { awayStatsEntered: true });
        }

        this.gateway.emitToTournament(tournamentId, 'matchStatsUpdated', { matchId });
        return { success: true };
    }

    // ─── VOTE MVP ─────────────────────────────────────────────────────────────

    async voteMvp(
        tournamentId: string,
        matchId: string,
        captainId: string,
        playerId: string,
    ): Promise<any> {
        const match = await this.matchRepo.findOneBy({ id: matchId, tournamentId });
        if (!match) throw new NotFoundException('Match not found');
        if (match.status !== 'played') throw new BadRequestException('MVP vote can only be cast after the match');

        const homeTeam = await this.teamRepo.findOneBy({ tournamentId, teamId: match.homeTeamId });
        const awayTeam = await this.teamRepo.findOneBy({ tournamentId, teamId: match.awayTeamId });

        const isHomeCaptain = homeTeam?.captainId === captainId;
        const isAwayCaptain = awayTeam?.captainId === captainId;

        if (!isHomeCaptain && !isAwayCaptain) throw new ForbiddenException('Only a team captain in this match can vote');

        // Home captain votes for away player, away captain votes for home player
        if (isHomeCaptain) {
            if (match.homeMvpVotePlayerId) throw new BadRequestException('You have already voted');
            const player = await this.rosterRepo.findOneBy({ id: playerId, teamId: match.awayTeamId, tournamentId });
            if (!player) throw new NotFoundException('Player not found in opponent roster');
            await this.rosterRepo.update(playerId, { mvpCount: player.mvpCount + 1 });
            await this.matchRepo.update(matchId, { homeMvpVotePlayerId: playerId });
        } else {
            if (match.awayMvpVotePlayerId) throw new BadRequestException('You have already voted');
            const player = await this.rosterRepo.findOneBy({ id: playerId, teamId: match.homeTeamId, tournamentId });
            if (!player) throw new NotFoundException('Player not found in opponent roster');
            await this.rosterRepo.update(playerId, { mvpCount: player.mvpCount + 1 });
            await this.matchRepo.update(matchId, { awayMvpVotePlayerId: playerId });
        }

        this.gateway.emitToTournament(tournamentId, 'matchStatsUpdated', { matchId });
        return { success: true };
    }

    // Get tournament-wide player stats (top scorers / assisters / MVPs)
    async getTournamentStats(tournamentId: string) {
        const players = await this.rosterRepo.find({
            where: { tournamentId },
            order: { goals: 'DESC' },
        });

        const topScorers  = [...players].sort((a, b) => b.goals   - a.goals  ).slice(0, 10).filter(p => p.goals   > 0);
        const topAssisters= [...players].sort((a, b) => b.assists  - a.assists).slice(0, 10).filter(p => p.assists > 0);
        const topMvp      = [...players].sort((a, b) => b.mvpCount - a.mvpCount).slice(0, 10).filter(p => p.mvpCount > 0);

        return { topScorers, topAssisters, topMvp };
    }
}
