import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Friendship } from './entities/friendship.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UsersService {
    private usersRepository;
    private transactionsRepository;
    private friendshipsRepository;
    private dataSource;
    private readonly notificationsService;
    constructor(usersRepository: Repository<User>, transactionsRepository: Repository<Transaction>, friendshipsRepository: Repository<Friendship>, dataSource: DataSource, notificationsService: NotificationsService);
    findOneByEmail(email: string): Promise<User | null>;
    findOneByPhone(phone: string): Promise<User | null>;
    findOneById(id: string): Promise<User | null>;
    generateReferralCode(): string;
    create(userData: Partial<User>): Promise<User>;
    update(id: string, userData: Partial<User>): Promise<User>;
    updateFcmToken(id: string, token: string): Promise<void>;
    updateBalance(id: string, amount: number): Promise<{
        id: string;
        balance: number;
    }>;
    findAll(page?: number, limit?: number, role?: string): Promise<{
        users: User[];
        total: number;
    }>;
    blockUser(id: string, reason: string): Promise<User>;
    unblockUser(id: string): Promise<User>;
    changeRole(id: string, role: string): Promise<User>;
    deleteUser(id: string): Promise<void>;
    getStats(): Promise<{
        total: number;
        players: number;
        partners: number;
        admins: number;
        blocked: number;
        newToday: number;
    }>;
    updateStats(id: string, stats: {
        goals: number;
        assists: number;
        isMvp: boolean;
    }): Promise<User>;
    incrementMvpCount(id: string): Promise<void>;
    search(query: string, page?: number, limit?: number): Promise<{
        users: User[];
        total: number;
    }>;
    searchPlayers(filters: {
        query?: string;
        position?: string;
        skillLevel?: string;
        minAge?: number;
        maxAge?: number;
        minRating?: number;
        sortBy?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: User[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    smartSearch(filters: {
        skillLevel?: string;
        district?: string;
        minAge?: number;
        maxAge?: number;
        preferredTime?: string;
        positions?: string[];
        excludeIds?: string[];
        limit?: number;
    }): Promise<{
        users: User[];
        scores: Record<string, number>;
    }>;
    getBatchRatings(userIds: string[]): Promise<Array<{
        id: string;
        name: string;
        avatar: string;
        mmr: number;
        attackRating: number;
        defenseRating: number;
    }>>;
    getBatchUsers(userIds: string[]): Promise<User[]>;
    calculateMMR(user: User): number;
    updatePlayActivity(userId: string, gameTime: string): Promise<void>;
    claimInstallBonus(userId: string): Promise<{
        success: boolean;
        balance: number;
        message: string;
    }>;
    claimProfileBonus(userId: string): Promise<{
        success: boolean;
        balance: number;
        message: string;
    }>;
    checkProfileCompletion(user: User): boolean;
    getProfileCompletionPercentage(user: User): {
        percentage: number;
        missingFields: string[];
    };
    applyBadges(userId: string, badges: Record<string, number>): Promise<{
        success: boolean;
        updates: Record<string, number>;
    }>;
    transferBalance(senderId: string, receiverId: string, amount: number, note?: string): Promise<Transaction>;
    getTransactionHistory(userId: string): Promise<Transaction[]>;
    incrementNoShowCount(userId: string): Promise<{
        noShowCount: number;
        warned: boolean;
    }>;
    addWarning(userId: string, reason: string): Promise<User>;
    sendFriendRequest(requesterId: string, receiverId: string): Promise<Friendship>;
    respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<Friendship>;
    getFriends(userId: string): Promise<User[]>;
    getPendingRequests(userId: string): Promise<any[]>;
    getFriendshipStatus(userId: string, targetId: string): Promise<{
        status: string;
        requestId?: string;
        isSender?: boolean;
    }>;
    removeFriend(userId: string, targetId: string): Promise<void>;
    getReferralInfo(userId: string): Promise<{
        referralCode: string;
        referralLink: string;
        referredCount: number;
        totalEarned: number;
    }>;
    processReferral(newUserId: string, referralCode: string): Promise<{
        success: boolean;
    }>;
    payReferrerBonus(userId: string): Promise<{
        paid: boolean;
    }>;
}
