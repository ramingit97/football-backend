import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('admin/all')
    findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('role') role?: string,
    ) {
        return this.usersService.findAll(page, limit, role);
    }

    @Get('admin/stats')
    getStats() {
        return this.usersService.getStats();
    }

    @Get('players/search')
    searchPlayers(
        @Query('query') query?: string,
        @Query('position') position?: string,
        @Query('skillLevel') skillLevel?: string,
        @Query('minAge') minAge?: number,
        @Query('maxAge') maxAge?: number,
        @Query('minRating') minRating?: number,
        @Query('sortBy') sortBy?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
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

    @Get('search/query')
    search(@Query('q') query: string, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.usersService.search(query || '', page, limit);
    }

    @Get('search')
    simpleSearch(@Query('query') query: string, @Query('limit') limit: number = 10) {
        return this.usersService.search(query || '', 1, limit);
    }

    @Post('smart-search')
    smartSearch(@Body() filters: any) {
        return this.usersService.smartSearch(filters);
    }

    @Post('batch-ratings')
    getBatchRatings(@Body() body: { userIds: string[] }) {
        return this.usersService.getBatchRatings(body.userIds);
    }

    @Post('batch')
    getBatchUsers(@Body() body: { userIds: string[] }) {
        return this.usersService.getBatchUsers(body.userIds);
    }

    @Post('friends/request')
    sendFriendRequest(@Body() body: { requesterId: string; receiverId: string }) {
        return this.usersService.sendFriendRequest(body.requesterId, body.receiverId);
    }

    @Post('friends/respond')
    respondToFriendRequest(@Body() body: { requestId: string; status: 'accepted' | 'rejected' }) {
        return this.usersService.respondToFriendRequest(body.requestId, body.status);
    }

    @Post('transfer')
    transferBalance(@Body() body: { senderId: string; receiverId: string; amount: number; note?: string }) {
        return this.usersService.transferBalance(body.senderId, body.receiverId, body.amount, body.note);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOneById(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateData: any) {
        return this.usersService.update(id, updateData);
    }

    @Post(':id/stats')
    updateStats(@Param('id') id: string, @Body() stats: { goals: number; assists: number; isMvp: boolean }) {
        return this.usersService.updateStats(id, stats);
    }

    @Patch(':id/balance')
    updateBalance(@Param('id') id: string, @Body() body: { amount: number }) {
        return this.usersService.updateBalance(id, body.amount);
    }

    @Patch(':id/fcm-token')
    updateFcmToken(@Param('id') id: string, @Body('token') token: string) {
        return this.usersService.updateFcmToken(id, token);
    }

    @Patch(':id/block')
    blockUser(@Param('id') id: string, @Body('reason') reason: string) {
        return this.usersService.blockUser(id, reason || 'Нарушение правил');
    }

    @Patch(':id/unblock')
    unblockUser(@Param('id') id: string) {
        return this.usersService.unblockUser(id);
    }

    @Patch(':id/role')
    changeRole(@Param('id') id: string, @Body('role') role: string) {
        return this.usersService.changeRole(id, role);
    }

    @Patch(':id/noshow-increment')
    incrementNoShow(@Param('id') id: string) {
        return this.usersService.incrementNoShowCount(id);
    }

    @Patch(':id/warning')
    addWarning(@Param('id') id: string, @Body('reason') reason: string) {
        return this.usersService.addWarning(id, reason);
    }

    @Delete(':id')
    deleteUser(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }

    @Get(':id/friends')
    getFriends(@Param('id') id: string) {
        return this.usersService.getFriends(id);
    }

    @Get(':id/friend-requests')
    getPendingRequests(@Param('id') id: string) {
        return this.usersService.getPendingRequests(id);
    }

    @Get(':id/friend-status/:targetId')
    getFriendshipStatus(@Param('id') id: string, @Param('targetId') targetId: string) {
        return this.usersService.getFriendshipStatus(id, targetId);
    }

    @Delete(':id/friends/:targetId')
    removeFriend(@Param('id') id: string, @Param('targetId') targetId: string) {
        return this.usersService.removeFriend(id, targetId);
    }

    @Get(':id/transactions')
    getTransactionHistory(@Param('id') id: string) {
        return this.usersService.getTransactionHistory(id);
    }

    @Get(':id/profile-completion')
    getProfileCompletion(@Param('id') id: string) {
        return this.usersService.findOneById(id).then(user => {
            if (!user) return { percentage: 0, missingFields: [] };
            return this.usersService.getProfileCompletionPercentage(user);
        });
    }

    @Get(':id/referral')
    getReferralInfo(@Param('id') id: string) {
        return this.usersService.getReferralInfo(id);
    }

    @Post(':id/stats')
    updateStatsPost(@Param('id') id: string, @Body() stats: { goals: number; assists: number; isMvp: boolean }) {
        return this.usersService.updateStats(id, stats);
    }

    @Post(':id/play-activity')
    updatePlayActivity(@Param('id') id: string, @Body() body: { gameTime: string }) {
        return this.usersService.updatePlayActivity(id, body.gameTime);
    }

    @Post(':id/increment-mvp')
    incrementMvpCount(@Param('id') id: string) {
        return this.usersService.incrementMvpCount(id);
    }

    @Post(':id/bonus/install')
    claimInstallBonus(@Param('id') id: string) {
        return this.usersService.claimInstallBonus(id);
    }

    @Post(':id/bonus/profile')
    claimProfileBonus(@Param('id') id: string) {
        return this.usersService.claimProfileBonus(id);
    }

    @Post(':id/apply-badges')
    applyBadges(@Param('id') id: string, @Body() body: { badges: Record<string, number> }) {
        return this.usersService.applyBadges(id, body.badges);
    }

    @Post(':id/process-referral')
    processReferral(@Param('id') id: string, @Body() body: { referralCode: string }) {
        return this.usersService.processReferral(id, body.referralCode);
    }

    @Post(':id/pay-referrer-bonus')
    payReferrerBonus(@Param('id') id: string) {
        return this.usersService.payReferrerBonus(id);
    }
}
