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
exports.ChallengesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const challenge_entity_1 = require("./entities/challenge.entity");
const games_service_1 = require("../games/games.service");
const teams_service_1 = require("../teams/teams.service");
const users_service_1 = require("../users/users.service");
let ChallengesService = class ChallengesService {
    constructor(challengesRepository, gamesService, teamsService, usersService) {
        this.challengesRepository = challengesRepository;
        this.gamesService = gamesService;
        this.teamsService = teamsService;
        this.usersService = usersService;
    }
    async create(createChallengeDto) {
        const challenge = this.challengesRepository.create(createChallengeDto);
        return this.challengesRepository.save(challenge);
    }
    async findAllByTeam(teamId) {
        return this.challengesRepository.find({
            where: [{ challengerTeamId: teamId }, { challengedTeamId: teamId }],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const challenge = await this.challengesRepository.findOne({ where: { id } });
        if (!challenge)
            throw new common_1.NotFoundException(`Challenge with ID ${id} not found`);
        return challenge;
    }
    async getUserInfo(userId) {
        try {
            return await this.usersService.findOneById(userId);
        }
        catch {
            return null;
        }
    }
    async respond(id, status) {
        const challenge = await this.findOne(id);
        challenge.status = status;
        if (status === 'accepted') {
            const challengerTeam = await this.teamsService.findOne(challenge.challengerTeamId);
            const challengedTeam = await this.teamsService.findOne(challenge.challengedTeamId);
            const challengerCaptain = await this.getUserInfo(challengerTeam.captainId);
            const format = challenge.format || '6x6';
            const playersPerTeam = parseInt(format.split('x')[0]) || 6;
            const maxPlayers = playersPerTeam * 2;
            const game = await this.gamesService.create({
                title: `Match: ${challenge.challengerName} vs ${challenge.challengedName}`,
                date: challenge.date,
                time: challenge.time,
                location: challenge.location,
                format,
                teamAColor: '#ff4d4f',
                teamBColor: '#1890ff',
                organizerId: challengerTeam.captainId,
                organizerName: challengerCaptain?.name || challenge.challengerName,
                maxPlayers,
                price: 0,
                gameType: 'private',
                teamAId: challengerTeam.id,
                teamBId: challengedTeam.id,
                teamAName: challenge.challengerName,
                teamBName: challenge.challengedName,
            });
            const allPlayersData = [];
            const teamAPositionCounts = {};
            const teamBPositionCounts = {};
            const getDefaultPosition = (rawPosition, index, team) => {
                const isTeamA = team === 'A';
                const baseX = isTeamA ? 10 : 90;
                const posMap = {
                    goalkeeper: { xOffset: 0, ySpread: [50] },
                    defender: { xOffset: isTeamA ? 15 : -15, ySpread: [25, 50, 75, 35, 65] },
                    midfielder: { xOffset: isTeamA ? 30 : -30, ySpread: [20, 40, 60, 80, 50] },
                    forward: { xOffset: isTeamA ? 42 : -42, ySpread: [35, 65, 50, 25, 75] },
                };
                const normalize = { gk: 'goalkeeper', def: 'defender', mid: 'midfielder', fwd: 'forward' };
                const pos = normalize[rawPosition?.toLowerCase()] || rawPosition?.toLowerCase() || 'midfielder';
                const config = posMap[pos] || posMap['midfielder'];
                return { x: baseX + config.xOffset, y: config.ySpread[index % config.ySpread.length] };
            };
            for (const playerId of challengerTeam.playerIds || []) {
                const userInfo = await this.getUserInfo(playerId);
                if (userInfo) {
                    const position = userInfo.position || 'midfielder';
                    const posIndex = teamAPositionCounts[position] || 0;
                    teamAPositionCounts[position] = posIndex + 1;
                    const { x, y } = getDefaultPosition(position, posIndex, 'A');
                    allPlayersData.push({ id: playerId, name: userInfo.name, avatar: userInfo.avatar, position, team: 'A', x, y });
                }
            }
            for (const playerId of challengedTeam.playerIds || []) {
                const userInfo = await this.getUserInfo(playerId);
                if (userInfo) {
                    const position = userInfo.position || 'midfielder';
                    const posIndex = teamBPositionCounts[position] || 0;
                    teamBPositionCounts[position] = posIndex + 1;
                    const { x, y } = getDefaultPosition(position, posIndex, 'B');
                    allPlayersData.push({ id: playerId, name: userInfo.name, avatar: userInfo.avatar, position, team: 'B', x, y });
                }
            }
            await this.gamesService.update(game.id, { players: allPlayersData });
            challenge.gameId = game.id;
        }
        return this.challengesRepository.save(challenge);
    }
};
exports.ChallengesService = ChallengesService;
exports.ChallengesService = ChallengesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(challenge_entity_1.Challenge)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        games_service_1.GamesService,
        teams_service_1.TeamsService,
        users_service_1.UsersService])
], ChallengesService);
//# sourceMappingURL=challenges.service.js.map