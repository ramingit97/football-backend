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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    findAll(page = 1, limit = 20, role) {
        return this.usersService.findAll(page, limit, role);
    }
    getStats() {
        return this.usersService.getStats();
    }
    searchPlayers(query, position, skillLevel, minAge, maxAge, minRating, sortBy, page = 1, limit = 20) {
        return this.usersService.searchPlayers({
            query, position, skillLevel,
            minAge: minAge ? Number(minAge) : undefined,
            maxAge: maxAge ? Number(maxAge) : undefined,
            minRating: minRating ? Number(minRating) : undefined,
            sortBy,
            page: Number(page),
            limit: Number(limit),
        });
    }
    search(query, page = 1, limit = 10) {
        return this.usersService.search(query || '', page, limit);
    }
    simpleSearch(query, limit = 10) {
        return this.usersService.search(query || '', 1, limit);
    }
    smartSearch(filters) {
        return this.usersService.smartSearch(filters);
    }
    getBatchRatings(body) {
        return this.usersService.getBatchRatings(body.userIds);
    }
    getBatchUsers(body) {
        return this.usersService.getBatchUsers(body.userIds);
    }
    sendFriendRequest(body) {
        return this.usersService.sendFriendRequest(body.requesterId, body.receiverId);
    }
    respondToFriendRequest(body) {
        return this.usersService.respondToFriendRequest(body.requestId, body.status);
    }
    transferBalance(body) {
        return this.usersService.transferBalance(body.senderId, body.receiverId, body.amount, body.note);
    }
    findOne(id) {
        return this.usersService.findOneById(id);
    }
    update(id, updateData) {
        return this.usersService.update(id, updateData);
    }
    updateStats(id, stats) {
        return this.usersService.updateStats(id, stats);
    }
    updateBalance(id, body) {
        return this.usersService.updateBalance(id, body.amount);
    }
    updateFcmToken(id, token) {
        return this.usersService.updateFcmToken(id, token);
    }
    blockUser(id, reason) {
        return this.usersService.blockUser(id, reason || 'Нарушение правил');
    }
    unblockUser(id) {
        return this.usersService.unblockUser(id);
    }
    changeRole(id, role) {
        return this.usersService.changeRole(id, role);
    }
    incrementNoShow(id) {
        return this.usersService.incrementNoShowCount(id);
    }
    addWarning(id, reason) {
        return this.usersService.addWarning(id, reason);
    }
    deleteUser(id) {
        return this.usersService.deleteUser(id);
    }
    getFriends(id) {
        return this.usersService.getFriends(id);
    }
    getPendingRequests(id) {
        return this.usersService.getPendingRequests(id);
    }
    getFriendshipStatus(id, targetId) {
        return this.usersService.getFriendshipStatus(id, targetId);
    }
    removeFriend(id, targetId) {
        return this.usersService.removeFriend(id, targetId);
    }
    getTransactionHistory(id) {
        return this.usersService.getTransactionHistory(id);
    }
    getProfileCompletion(id) {
        return this.usersService.findOneById(id).then(user => {
            if (!user)
                return { percentage: 0, missingFields: [] };
            return this.usersService.getProfileCompletionPercentage(user);
        });
    }
    getReferralInfo(id) {
        return this.usersService.getReferralInfo(id);
    }
    updateStatsPost(id, stats) {
        return this.usersService.updateStats(id, stats);
    }
    updatePlayActivity(id, body) {
        return this.usersService.updatePlayActivity(id, body.gameTime);
    }
    incrementMvpCount(id) {
        return this.usersService.incrementMvpCount(id);
    }
    claimInstallBonus(id) {
        return this.usersService.claimInstallBonus(id);
    }
    claimProfileBonus(id) {
        return this.usersService.claimProfileBonus(id);
    }
    applyBadges(id, body) {
        return this.usersService.applyBadges(id, body.badges);
    }
    processReferral(id, body) {
        return this.usersService.processReferral(id, body.referralCode);
    }
    payReferrerBonus(id) {
        return this.usersService.payReferrerBonus(id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('admin/all'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('players/search'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('position')),
    __param(2, (0, common_1.Query)('skillLevel')),
    __param(3, (0, common_1.Query)('minAge')),
    __param(4, (0, common_1.Query)('maxAge')),
    __param(5, (0, common_1.Query)('minRating')),
    __param(6, (0, common_1.Query)('sortBy')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number, Number, String, Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "searchPlayers", null);
__decorate([
    (0, common_1.Get)('search/query'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "simpleSearch", null);
__decorate([
    (0, common_1.Post)('smart-search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "smartSearch", null);
__decorate([
    (0, common_1.Post)('batch-ratings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getBatchRatings", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getBatchUsers", null);
__decorate([
    (0, common_1.Post)('friends/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "sendFriendRequest", null);
__decorate([
    (0, common_1.Post)('friends/respond'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "respondToFriendRequest", null);
__decorate([
    (0, common_1.Post)('transfer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "transferBalance", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStats", null);
__decorate([
    (0, common_1.Patch)(':id/balance'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateBalance", null);
__decorate([
    (0, common_1.Patch)(':id/fcm-token'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateFcmToken", null);
__decorate([
    (0, common_1.Patch)(':id/block'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Patch)(':id/unblock'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "changeRole", null);
__decorate([
    (0, common_1.Patch)(':id/noshow-increment'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "incrementNoShow", null);
__decorate([
    (0, common_1.Patch)(':id/warning'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "addWarning", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)(':id/friends'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFriends", null);
__decorate([
    (0, common_1.Get)(':id/friend-requests'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)(':id/friend-status/:targetId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('targetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFriendshipStatus", null);
__decorate([
    (0, common_1.Delete)(':id/friends/:targetId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('targetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "removeFriend", null);
__decorate([
    (0, common_1.Get)(':id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getTransactionHistory", null);
__decorate([
    (0, common_1.Get)(':id/profile-completion'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfileCompletion", null);
__decorate([
    (0, common_1.Get)(':id/referral'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getReferralInfo", null);
__decorate([
    (0, common_1.Post)(':id/stats'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatsPost", null);
__decorate([
    (0, common_1.Post)(':id/play-activity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updatePlayActivity", null);
__decorate([
    (0, common_1.Post)(':id/increment-mvp'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "incrementMvpCount", null);
__decorate([
    (0, common_1.Post)(':id/bonus/install'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "claimInstallBonus", null);
__decorate([
    (0, common_1.Post)(':id/bonus/profile'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "claimProfileBonus", null);
__decorate([
    (0, common_1.Post)(':id/apply-badges'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "applyBadges", null);
__decorate([
    (0, common_1.Post)(':id/process-referral'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "processReferral", null);
__decorate([
    (0, common_1.Post)(':id/pay-referrer-bonus'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "payReferrerBonus", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map