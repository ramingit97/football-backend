import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(page?: number, limit?: number, role?: string): Promise<{
        users: import("./entities/user.entity").User[];
        total: number;
    }>;
    getStats(): Promise<{
        total: number;
        players: number;
        partners: number;
        admins: number;
        blocked: number;
        newToday: number;
    }>;
    searchPlayers(query?: string, position?: string, skillLevel?: string, minAge?: number, maxAge?: number, minRating?: number, sortBy?: string, page?: number, limit?: number): Promise<{
        users: import("./entities/user.entity").User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    search(query: string, page?: number, limit?: number): Promise<{
        users: import("./entities/user.entity").User[];
        total: number;
    }>;
    simpleSearch(query: string, limit?: number): Promise<{
        users: import("./entities/user.entity").User[];
        total: number;
    }>;
    smartSearch(filters: any): Promise<{
        users: import("./entities/user.entity").User[];
        scores: Record<string, number>;
    }>;
    getBatchRatings(body: {
        userIds: string[];
    }): Promise<{
        id: string;
        name: string;
        avatar: string;
        mmr: number;
        attackRating: number;
        defenseRating: number;
    }[]>;
    getBatchUsers(body: {
        userIds: string[];
    }): Promise<import("./entities/user.entity").User[]>;
    sendFriendRequest(body: {
        requesterId: string;
        receiverId: string;
    }): Promise<import("./entities/friendship.entity").Friendship>;
    respondToFriendRequest(body: {
        requestId: string;
        status: 'accepted' | 'rejected';
    }): Promise<import("./entities/friendship.entity").Friendship>;
    transferBalance(body: {
        senderId: string;
        receiverId: string;
        amount: number;
        note?: string;
    }): Promise<import("./entities/transaction.entity").Transaction>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    update(id: string, updateData: any): Promise<import("./entities/user.entity").User>;
    updateStats(id: string, stats: {
        goals: number;
        assists: number;
        isMvp: boolean;
    }): Promise<import("./entities/user.entity").User>;
    updateBalance(id: string, body: {
        amount: number;
    }): Promise<{
        id: string;
        balance: number;
    }>;
    updateFcmToken(id: string, token: string): Promise<void>;
    blockUser(id: string, reason: string): Promise<import("./entities/user.entity").User>;
    unblockUser(id: string): Promise<import("./entities/user.entity").User>;
    changeRole(id: string, role: string): Promise<import("./entities/user.entity").User>;
    incrementNoShow(id: string): Promise<{
        noShowCount: number;
        warned: boolean;
    }>;
    addWarning(id: string, reason: string): Promise<import("./entities/user.entity").User>;
    deleteUser(id: string): Promise<void>;
    getFriends(id: string): Promise<import("./entities/user.entity").User[]>;
    getPendingRequests(id: string): Promise<any[]>;
    getFriendshipStatus(id: string, targetId: string): Promise<{
        status: string;
        requestId?: string;
        isSender?: boolean;
    }>;
    removeFriend(id: string, targetId: string): Promise<void>;
    getTransactionHistory(id: string): Promise<import("./entities/transaction.entity").Transaction[]>;
    getProfileCompletion(id: string): Promise<{
        percentage: number;
        missingFields: string[];
    }>;
    getReferralInfo(id: string): Promise<{
        referralCode: string;
        referralLink: string;
        referredCount: number;
        totalEarned: number;
    }>;
    updateStatsPost(id: string, stats: {
        goals: number;
        assists: number;
        isMvp: boolean;
    }): Promise<import("./entities/user.entity").User>;
    updatePlayActivity(id: string, body: {
        gameTime: string;
    }): Promise<void>;
    incrementMvpCount(id: string): Promise<void>;
    claimInstallBonus(id: string): Promise<{
        success: boolean;
        balance: number;
        message: string;
    }>;
    claimProfileBonus(id: string): Promise<{
        success: boolean;
        balance: number;
        message: string;
    }>;
    applyBadges(id: string, body: {
        badges: Record<string, number>;
    }): Promise<{
        success: boolean;
        updates: Record<string, number>;
    }>;
    processReferral(id: string, body: {
        referralCode: string;
    }): Promise<{
        success: boolean;
    }>;
    payReferrerBonus(id: string): Promise<{
        paid: boolean;
    }>;
}
