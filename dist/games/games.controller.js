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
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const games_service_1 = require("./games.service");
const finish_game_dto_1 = require("./dto/finish-game.dto");
let GamesController = class GamesController {
    constructor(gamesService) {
        this.gamesService = gamesService;
    }
    findAll(page, limit, status, format, district, metro) {
        return this.gamesService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 12, status, format, district, metro);
    }
    findNearby(lat, lng, radius) {
        return this.gamesService.findNearby(lat, lng, radius);
    }
    getHotGames() {
        return this.gamesService.getHotGames();
    }
    findOne(id) {
        return this.gamesService.findOne(id);
    }
    findByTeam(teamId) {
        return this.gamesService.findByTeam(teamId);
    }
    create(gameData) {
        return this.gamesService.create(gameData);
    }
    update(id, gameData) {
        return this.gamesService.update(id, gameData);
    }
    setUrgent(id, body) {
        return this.gamesService.setUrgent(id, body.isUrgent);
    }
    delete(id) {
        return this.gamesService.delete(id);
    }
    joinGame(id, body) {
        const { referredBy, ...player } = body;
        return this.gamesService.joinGame(id, player, referredBy);
    }
    finishGame(id, finishData) {
        return this.gamesService.finishGame(id, finishData);
    }
    leaveGame(id, body) {
        return this.gamesService.leaveGame(id, body.playerId);
    }
    smartInvite(id, filters) {
        return this.gamesService.smartInvite(id, filters);
    }
    acceptInvite(id, body) {
        return this.gamesService.acceptInvite(id, body.playerId);
    }
    balanceTeams(id) {
        return this.gamesService.balanceTeams(id);
    }
    sendPrivateInvites(id, body) {
        return this.gamesService.sendPrivateInvites(id, body.playerIds);
    }
    getGameInvites(id) {
        return this.gamesService.getGameInvites(id);
    }
    getUserInvitations(userId) {
        return this.gamesService.getUserInvitations(userId);
    }
    startFinishGame(id, scoreData) {
        return this.gamesService.startFinishGame(id, scoreData);
    }
    claimStats(id, body) {
        return this.gamesService.claimStats(id, body.playerId, { goals: body.goals, assists: body.assists });
    }
    getPendingStats(id) {
        return this.gamesService.getPendingStats(id);
    }
    validateStats(id, body) {
        return this.gamesService.validateStats(id, body.organizerId, body.stats);
    }
    castMvpVote(id, body) {
        return this.gamesService.castMvpVote(id, body.voterId, body.votedPlayerId);
    }
    completeGame(id) {
        return this.gamesService.completeGame(id);
    }
    submitPostGame(id, body) {
        return this.gamesService.submitPostGame(id, body.playerId, {
            goals: body.goals,
            assists: body.assists,
            mvpVoteId: body.mvpVoteId
        });
    }
    reportNoShows(id, body) {
        return this.gamesService.reportNoShows(id, body.reportedByUserId, body.players);
    }
    getAllNoShows(userId) {
        return this.gamesService.getNoShows(userId);
    }
    getUserNoShows(userId) {
        return this.gamesService.getNoShows(userId);
    }
    submitReport(body) {
        return this.gamesService.submitReport(body);
    }
    getReports(status) {
        return this.gamesService.getReports(status);
    }
    updateReport(id, body) {
        return this.gamesService.updateReport(id, body);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('format')),
    __param(4, (0, common_1.Query)('district')),
    __param(5, (0, common_1.Query)('metro')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Get)('hot'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getHotGames", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('team/:teamId'),
    __param(0, (0, common_1.Param)('teamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "findByTeam", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/urgent'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "setUrgent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "joinGame", null);
__decorate([
    (0, common_1.Post)(':id/finish'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finish_game_dto_1.FinishGameDto]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "finishGame", null);
__decorate([
    (0, common_1.Post)(':id/leave'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "leaveGame", null);
__decorate([
    (0, common_1.Post)(':id/smart-invite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "smartInvite", null);
__decorate([
    (0, common_1.Post)(':id/accept-invite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)(':id/balance-teams'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "balanceTeams", null);
__decorate([
    (0, common_1.Post)(':id/private-invite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "sendPrivateInvites", null);
__decorate([
    (0, common_1.Get)(':id/invites'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getGameInvites", null);
__decorate([
    (0, common_1.Get)('invitations/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getUserInvitations", null);
__decorate([
    (0, common_1.Post)(':id/start-finish'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "startFinishGame", null);
__decorate([
    (0, common_1.Post)(':id/claim-stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "claimStats", null);
__decorate([
    (0, common_1.Get)(':id/pending-stats'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getPendingStats", null);
__decorate([
    (0, common_1.Post)(':id/validate-stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "validateStats", null);
__decorate([
    (0, common_1.Post)(':id/cast-mvp-vote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "castMvpVote", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "completeGame", null);
__decorate([
    (0, common_1.Post)(':id/submit-postgame'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "submitPostGame", null);
__decorate([
    (0, common_1.Post)(':id/report-noshows'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "reportNoShows", null);
__decorate([
    (0, common_1.Get)('noshows/all'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getAllNoShows", null);
__decorate([
    (0, common_1.Get)('noshows/user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getUserNoShows", null);
__decorate([
    (0, common_1.Post)('reports'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Get)('reports/all'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getReports", null);
__decorate([
    (0, common_1.Patch)('reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "updateReport", null);
exports.GamesController = GamesController = __decorate([
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], GamesController);
//# sourceMappingURL=games.controller.js.map