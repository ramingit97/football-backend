"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_entity_1 = require("./entities/team.entity");
const team_join_request_entity_1 = require("./entities/team-join-request.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let TeamsService = class TeamsService {
    constructor(teamsRepository, requestsRepository, notificationsService) {
        this.teamsRepository = teamsRepository;
        this.requestsRepository = requestsRepository;
        this.notificationsService = notificationsService;
    }
    async create(createTeamDto) {
        const team = this.teamsRepository.create({
            ...createTeamDto,
            playerIds: [createTeamDto.captainId],
        });
        return this.teamsRepository.save(team);
    }
    async findAll() {
        return this.teamsRepository.find();
    }
    async findOne(id) {
        const team = await this.teamsRepository.findOne({ where: { id } });
        if (!team)
            throw new common_1.NotFoundException(`Team with ID ${id} not found`);
        return team;
    }
    async findByCaptain(captainId) {
        return this.teamsRepository.findOne({ where: { captainId } });
    }
    async joinTeam(teamId, userId) {
        const team = await this.findOne(teamId);
        if (!team.playerIds.includes(userId)) {
            team.playerIds.push(userId);
            return this.teamsRepository.save(team);
        }
        return team;
    }
    async leaveTeam(teamId, userId) {
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
    async getMyTeams(userId) {
        const allTeams = await this.teamsRepository.find();
        return allTeams.filter(team => team.playerIds.includes(userId));
    }
    async requestJoin(teamId, userId) {
        const team = await this.findOne(teamId);
        if (team.playerIds.includes(userId))
            throw new Error('User is already in the team');
        const existingRequest = await this.requestsRepository.findOne({ where: { teamId, userId, status: 'pending' } });
        if (existingRequest)
            return existingRequest;
        const request = this.requestsRepository.create({ teamId, userId, status: 'pending' });
        const saved = await this.requestsRepository.save(request);
        try {
            await this.notificationsService.sendNotification(team.captainId, 'TEAM_JOIN_REQUEST', 'Запрос на вступление в команду', `Игрок хочет вступить в вашу команду "${team.name}".`, undefined, { teamId: team.id });
        }
        catch (e) {
            console.error('Failed to notify captain:', e.message);
        }
        return saved;
    }
    async invitePlayer(teamId, userId) {
        const team = await this.findOne(teamId);
        if (team.playerIds.includes(userId))
            throw new Error('User is already in the team');
        const existingRequest = await this.requestsRepository.findOne({ where: { teamId, userId, status: 'invited' } });
        if (existingRequest)
            return existingRequest;
        const request = this.requestsRepository.create({ teamId, userId, status: 'invited' });
        const saved = await this.requestsRepository.save(request);
        try {
            await this.notificationsService.sendNotification(userId, 'TEAM_INVITE', 'Приглашение в команду', `Вас пригласили вступить в команду "${team.name}".`, undefined, { teamId: team.id });
        }
        catch (e) {
            console.error('Failed to notify player:', e.message);
        }
        return saved;
    }
    async getRequests(teamId) {
        return this.requestsRepository.find({ where: { teamId, status: 'pending' }, order: { createdAt: 'DESC' } });
    }
    async getMyRequests(userId) {
        return this.requestsRepository.find({
            where: [{ userId, status: 'pending' }, { userId, status: 'invited' }],
            relations: ['team'],
            order: { createdAt: 'DESC' },
        });
    }
    async respondToRequest(requestId, status) {
        const request = await this.requestsRepository.findOne({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        request.status = status;
        const savedRequest = await this.requestsRepository.save(request);
        if (status === 'approved')
            await this.joinTeam(request.teamId, request.userId);
        return savedRequest;
    }
    async transferCaptain(teamId, newCaptainId, currentUserId) {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId)
            throw new Error('Only the captain can transfer captaincy');
        if (!team.playerIds.includes(newCaptainId))
            throw new Error('New captain must be a member of the team');
        team.captainId = newCaptainId;
        return this.teamsRepository.save(team);
    }
    async findAllFiltered(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.teamsRepository.createQueryBuilder('team');
        if (filters?.minRating !== undefined)
            queryBuilder.andWhere('team.rating >= :minRating', { minRating: filters.minRating });
        if (filters?.maxRating !== undefined)
            queryBuilder.andWhere('team.rating <= :maxRating', { maxRating: filters.maxRating });
        queryBuilder.orderBy(`team.${filters?.sortBy || 'rating'}`, filters?.sortOrder || 'DESC');
        queryBuilder.skip(skip).take(limit);
        const [teams, total] = await queryBuilder.getManyAndCount();
        return { teams, total, page, limit };
    }
    async updateFormation(teamId, formation, currentUserId) {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId)
            throw new Error('Only the captain can update the formation');
        team.formation = formation;
        return this.teamsRepository.save(team);
    }
    async updateFormationByFormat(teamId, gameFormat, formationString, players, currentUserId) {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId)
            throw new Error('Only the captain can update the formation');
        team.formations = { ...(team.formations || {}), [gameFormat]: { formationString, players } };
        return this.teamsRepository.save(team);
    }
    async getFormationByFormat(teamId, gameFormat) {
        const team = await this.findOne(teamId);
        return team.formations?.[gameFormat] || null;
    }
    async updateFlag(teamId, flagUrl, currentUserId) {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId)
            throw new Error('Only the captain can update the team flag');
        team.flag = flagUrl;
        return this.teamsRepository.save(team);
    }
    async updateReservePlayers(teamId, reservePlayerIds, currentUserId) {
        const team = await this.findOne(teamId);
        if (team.captainId !== currentUserId)
            throw new Error('Only the captain can update reserve players');
        team.reservePlayerIds = reservePlayerIds;
        return this.teamsRepository.save(team);
    }
    async updateStatsAfterMatch(winnerId, loserId, isDraw = false) {
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
        }
        else {
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
    async update(id, updateData) {
        await this.teamsRepository.update(id, updateData);
        return this.findOne(id);
    }
    async delete(id) {
        await this.teamsRepository.delete(id);
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(team_entity_1.Team)),
    __param(1, (0, typeorm_1.InjectRepository)(team_join_request_entity_1.TeamJoinRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map