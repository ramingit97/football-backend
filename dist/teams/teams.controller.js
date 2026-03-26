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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const teams_service_1 = require("./teams.service");
let TeamsController = class TeamsController {
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    create(createTeamDto) {
        console.log('Creating team:', createTeamDto);
        return this.teamsService.create(createTeamDto);
    }
    findAll(minRating, maxRating, page, limit, sortBy, sortOrder) {
        return this.teamsService.findAllFiltered({
            minRating: minRating ? parseInt(minRating, 10) : undefined,
            maxRating: maxRating ? parseInt(maxRating, 10) : undefined,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            sortBy,
            sortOrder,
        });
    }
    getMyTeams(userId) {
        return this.teamsService.getMyTeams(userId);
    }
    getMyRequests(req, userId) {
        return this.teamsService.getMyRequests(userId);
    }
    findOne(id) {
        return this.teamsService.findOne(id);
    }
    join(id, userId) {
        return this.teamsService.joinTeam(id, userId);
    }
    leave(id, userId) {
        return this.teamsService.leaveTeam(id, userId);
    }
    requestJoin(id, userId) {
        return this.teamsService.requestJoin(id, userId);
    }
    invitePlayer(id, userId) {
        return this.teamsService.invitePlayer(id, userId);
    }
    getRequests(id) {
        return this.teamsService.getRequests(id);
    }
    respondToRequest(requestId, status) {
        return this.teamsService.respondToRequest(requestId, status);
    }
    transferCaptain(id, newCaptainId, currentUserId) {
        return this.teamsService.transferCaptain(id, newCaptainId, currentUserId);
    }
    updateFormation(id, formation, currentUserId) {
        return this.teamsService.updateFormation(id, formation, currentUserId);
    }
    updateFormationByFormat(id, gameFormat, formationString, players, currentUserId) {
        return this.teamsService.updateFormationByFormat(id, gameFormat, formationString, players, currentUserId);
    }
    getFormationByFormat(id, gameFormat) {
        return this.teamsService.getFormationByFormat(id, gameFormat);
    }
    updateFlag(id, flagUrl, currentUserId) {
        return this.teamsService.updateFlag(id, flagUrl, currentUserId);
    }
    updateReservePlayers(id, reservePlayerIds, currentUserId) {
        return this.teamsService.updateReservePlayers(id, reservePlayerIds, currentUserId);
    }
    updateMatchResult(winnerId, loserId, isDraw) {
        return this.teamsService.updateStatsAfterMatch(winnerId, loserId, isDraw);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('minRating')),
    __param(1, (0, common_1.Query)('maxRating')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('sortBy')),
    __param(5, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getMyTeams", null);
__decorate([
    (0, common_1.Get)('requests/my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "join", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)(':id/join-request'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "requestJoin", null);
__decorate([
    (0, common_1.Post)(':id/invite'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "invitePlayer", null);
__decorate([
    (0, common_1.Get)(':id/requests'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Post)('requests/:requestId/respond'),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "respondToRequest", null);
__decorate([
    (0, common_1.Put)(':id/captain'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('newCaptainId')),
    __param(2, (0, common_1.Body)('currentUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "transferCaptain", null);
__decorate([
    (0, common_1.Put)(':id/formation'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('formation')),
    __param(2, (0, common_1.Body)('currentUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateFormation", null);
__decorate([
    (0, common_1.Put)(':id/formation/:gameFormat'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('gameFormat')),
    __param(2, (0, common_1.Body)('formationString')),
    __param(3, (0, common_1.Body)('players')),
    __param(4, (0, common_1.Body)('currentUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateFormationByFormat", null);
__decorate([
    (0, common_1.Get)(':id/formation/:gameFormat'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('gameFormat')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getFormationByFormat", null);
__decorate([
    (0, common_1.Put)(':id/flag'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('flagUrl')),
    __param(2, (0, common_1.Body)('currentUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateFlag", null);
__decorate([
    (0, common_1.Put)(':id/reserves'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reservePlayerIds')),
    __param(2, (0, common_1.Body)('currentUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateReservePlayers", null);
__decorate([
    (0, common_1.Post)('match-result'),
    __param(0, (0, common_1.Body)('winnerId')),
    __param(1, (0, common_1.Body)('loserId')),
    __param(2, (0, common_1.Body)('isDraw')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateMatchResult", null);
exports.TeamsController = TeamsController = __decorate([
    (0, common_1.Controller)('teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map