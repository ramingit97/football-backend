import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team)
        private teamsRepository: Repository<Team>,
        @InjectRepository(TeamJoinRequest)
        private requestsRepository: Repository<TeamJoinRequest>,
        private readonly notificationsService: NotificationsService,
    ) {}

    async create(createTeamDto: any): Promise<Team> {
        const team = this.teamsRepository.create({
            ...createTeamDto,
            playerIds: [createTeamDto.captainId],
        } as Team);
        return this.teamsRepository.save(team);
    }

    async findAll(): Promise<Team[]> {
        return this.teamsRepository.find();
    }

    async findOne(id: string): Promise<Team> {
        const team = await this.teamsRepository.findOne({ where: { id } });
        if (!team) throw new NotFoundException(`Team with ID ${id} not found`);
        return team;
    }

    async findByCaptain(captainId: string): Promise<Team | null> {
        return this.teamsRepository.findOne({ where: { captainId } });
    }

    async joinTeam(teamId: string, userId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (!team.playerIds.includes(userId)) {
            team.playerIds.push(userId);
            return this.teamsRepository.save(team);
        }
        return team;
    }

    async leaveTeam(teamId: string, userId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId === userId) {
            throw new Error('Captain cannot leave the team without transferring captaincy first');
        }
        if (team.playerIds.includes(userId)) {
            team.playerIds = team.playerIds.filter(id => id !== userId);
            if (team.reservePlayerIds) {
                team.reservePlayerIds = team.reservePlayerIds.filter(id => id !== userId);
            }
            return this.teamsRepository.save(team);
        }
        return team;
    }

    async getMyTeams(userId: string): Promise<Team[]> {
        const allTeams = await this.teamsRepository.find();
        return allTeams.filter(team => team.playerIds.includes(userId));
    }

    async requestJoin(teamId: string, userId: string): Promise<TeamJoinRequest> {
        const team = await this.findOne(teamId);
        if (team.playerIds.includes(userId)) throw new Error('User is already in the team');

        const existingRequest = await this.requestsRepository.findOne({ where: { teamId, userId, status: 'pending' } });
        if (existingRequest) return existingRequest;

        const request = this.requestsRepository.create({ teamId, userId, status: 'pending' });
        const saved = await this.requestsRepository.save(request);

        try {
            await this.notificationsService.sendNotification(
                team.captainId,
                'TEAM_JOIN_REQUEST',
                'Запрос на вступление в команду',
                `Игрок хочет вступить в вашу команду "${team.name}".`,
                undefined, { teamId: team.id },
            );
        } catch (e) {
            console.error('Failed to notify captain:', e.message);
        }

        return saved;
    }

    async invitePlayer(teamId: string, userId: string): Promise<TeamJoinRequest> {
        const team = await this.findOne(teamId);
        if (team.playerIds.includes(userId)) throw new Error('User is already in the team');

        const existingRequest = await this.requestsRepository.findOne({ where: { teamId, userId, status: 'invited' } });
        if (existingRequest) return existingRequest;

        const request = this.requestsRepository.create({ teamId, userId, status: 'invited' });
        const saved = await this.requestsRepository.save(request);

        try {
            await this.notificationsService.sendNotification(
                userId,
                'TEAM_INVITE',
                'Приглашение в команду',
                `Вас пригласили вступить в команду "${team.name}".`,
                undefined, { teamId: team.id },
            );
        } catch (e) {
            console.error('Failed to notify player:', e.message);
        }

        return saved;
    }

    async getRequests(teamId: string): Promise<TeamJoinRequest[]> {
        return this.requestsRepository.find({ where: { teamId, status: 'pending' }, order: { createdAt: 'DESC' } });
    }

    async getMyRequests(userId: string): Promise<TeamJoinRequest[]> {
        return this.requestsRepository.find({
            where: [{ userId, status: 'pending' }, { userId, status: 'invited' }],
            relations: ['team'],
            order: { createdAt: 'DESC' },
        });
    }

    async respondToRequest(requestId: string, status: 'approved' | 'rejected'): Promise<TeamJoinRequest> {
        const request = await this.requestsRepository.findOne({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');
        request.status = status;
        const savedRequest = await this.requestsRepository.save(request);
        if (status === 'approved') await this.joinTeam(request.teamId, request.userId);
        return savedRequest;
    }

    async transferCaptain(teamId: string, newCaptainId: string, currentUserId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId) throw new Error('Only the captain can transfer captaincy');
        if (!team.playerIds.includes(newCaptainId)) throw new Error('New captain must be a member of the team');
        team.captainId = newCaptainId;
        return this.teamsRepository.save(team);
    }

    async findAllFiltered(filters?: any): Promise<{ teams: Team[]; total: number; page: number; limit: number }> {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.teamsRepository.createQueryBuilder('team');
        if (filters?.minRating !== undefined) queryBuilder.andWhere('team.rating >= :minRating', { minRating: filters.minRating });
        if (filters?.maxRating !== undefined) queryBuilder.andWhere('team.rating <= :maxRating', { maxRating: filters.maxRating });
        queryBuilder.orderBy(`team.${filters?.sortBy || 'rating'}`, filters?.sortOrder || 'DESC');
        queryBuilder.skip(skip).take(limit);
        const [teams, total] = await queryBuilder.getManyAndCount();
        return { teams, total, page, limit };
    }

    async updateFormation(teamId: string, formation: any[], currentUserId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId) throw new Error('Only the captain can update the formation');
        team.formation = formation;
        return this.teamsRepository.save(team);
    }

    async updateFormationByFormat(teamId: string, gameFormat: string, formationString: string, players: any[], currentUserId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId) throw new Error('Only the captain can update the formation');
        team.formations = { ...(team.formations || {}), [gameFormat]: { formationString, players } };
        return this.teamsRepository.save(team);
    }

    async getFormationByFormat(teamId: string, gameFormat: string) {
        const team = await this.findOne(teamId);
        return team.formations?.[gameFormat] || null;
    }

    async updateFlag(teamId: string, flagUrl: string, currentUserId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId) throw new Error('Only the captain can update the team flag');
        team.flag = flagUrl;
        return this.teamsRepository.save(team);
    }

    async updateReservePlayers(teamId: string, reservePlayerIds: string[], currentUserId: string): Promise<Team> {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId) throw new Error('Only the captain can update reserve players');
        team.reservePlayerIds = reservePlayerIds;
        return this.teamsRepository.save(team);
    }

    async updateStatsAfterMatch(winnerId: string, loserId: string, isDraw: boolean = false): Promise<void> {
        const winnerTeam = await this.findOne(winnerId);
        const loserTeam = await this.findOne(loserId);
        const K = 32;
        const expectedWinner = 1 / (1 + Math.pow(10, (loserTeam.rating - winnerTeam.rating) / 400));
        const expectedLoser = 1 - expectedWinner;
        if (isDraw) {
            winnerTeam.draws += 1;
            loserTeam.draws += 1;
            winnerTeam.rating = Math.round(winnerTeam.rating + K * (0.5 - expectedWinner));
            loserTeam.rating = Math.round(loserTeam.rating + K * (0.5 - expectedLoser));
        } else {
            winnerTeam.wins += 1;
            loserTeam.losses += 1;
            winnerTeam.rating = Math.round(winnerTeam.rating + K * (1 - expectedWinner));
            loserTeam.rating = Math.round(loserTeam.rating + K * (0 - expectedLoser));
        }
        winnerTeam.rating = Math.max(100, winnerTeam.rating);
        loserTeam.rating = Math.max(100, loserTeam.rating);
        winnerTeam.gamesPlayed += 1;
        loserTeam.gamesPlayed += 1;
        await this.teamsRepository.save([winnerTeam, loserTeam]);
    }

    async update(id: string, updateData: Partial<Team>): Promise<Team> {
        await this.teamsRepository.update(id, updateData);
        return this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.teamsRepository.delete(id);
    }
}
