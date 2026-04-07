import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, DataSource, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Friendship } from './entities/friendship.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        @InjectRepository(Friendship)
        private friendshipsRepository: Repository<Friendship>,
        @InjectRepository(SupportTicket)
        private supportTicketRepo: Repository<SupportTicket>,
        private dataSource: DataSource,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
    ) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async findOneByPhone(phone: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { phone } });
    }

    async findOneById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
            relations: ['achievements']
        });
    }

    generateReferralCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    async create(userData: Partial<User> & { initialBalance?: number }): Promise<User> {
        const { initialBalance, ...rest } = userData as any;
        const user = this.usersRepository.create(rest as Partial<User>);
        // Welcome Bonus: default 1 AZN, can be overridden (e.g. Google gets 3 AZN)
        user.balance = initialBalance ?? 1.00;
        // Auto-generate unique referral code
        let referralCode = this.generateReferralCode();
        // Ensure uniqueness
        while (await this.usersRepository.findOne({ where: { referralCode } })) {
            referralCode = this.generateReferralCode();
        }
        user.referralCode = referralCode;
        return this.usersRepository.save(user);
    }

    async update(id: string, userData: Partial<User>): Promise<User> {
        // Filter out relations and read-only fields that can't be updated directly
        const {
            achievements,
            id: userId,
            email,
            password,
            createdAt,
            ...updateableData
        } = userData as any;

        await this.usersRepository.update(id, updateableData);
        const updatedUser = await this.findOneById(id);
        if (!updatedUser) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return updatedUser;
    }

    async updateFcmToken(id: string, token: string): Promise<void> {
        await this.usersRepository.update(id, { fcmToken: token });
    }

    async updateBalance(id: string, amount: number): Promise<{ id: string; balance: number }> {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('User not found');

        // Add amount (can be negative for deduction)
        user.balance = (user.balance || 0) + amount;

        // Prevent negative balance
        if (user.balance < 0) {
            throw new BadRequestException('Insufficient funds');
        }

        await this.usersRepository.save(user);
        return { id: user.id, balance: user.balance };
    }

    // Admin: Get all users with pagination
    async findAll(page: number = 1, limit: number = 20, role?: string): Promise<{ users: User[], total: number }> {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (role) where.role = role;

        const [users, total] = await this.usersRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
            select: ['id', 'email', 'name', 'phone', 'role', 'blocked', 'createdAt', 'gamesPlayed', 'averageRating', 'balance']
        });

        return { users, total };
    }

    // Admin: Block user
    async blockUser(id: string, reason: string): Promise<User> {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('User not found');

        user.blocked = true;
        user.blockedReason = reason;
        user.blockedAt = new Date();

        return this.usersRepository.save(user);
    }

    // Admin: Unblock user
    async unblockUser(id: string): Promise<User> {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('User not found');

        user.blocked = false;
        (user as any).blockedReason = null;
        (user as any).blockedAt = null;

        return this.usersRepository.save(user);
    }

    // Admin: Change user role
    async changeRole(id: string, role: string): Promise<User> {
        const user = await this.findOneById(id);
        if (!user) throw new NotFoundException('User not found');

        user.role = role;
        return this.usersRepository.save(user);
    }

    // Admin: Delete user
    async deleteUser(id: string): Promise<void> {
        await this.usersRepository.delete(id);
    }

    // Admin: Get user statistics
    async getStats(): Promise<{
        total: number;
        players: number;
        partners: number;
        admins: number;
        blocked: number;
        newToday: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [total, players, partners, admins, blocked] = await Promise.all([
            this.usersRepository.count(),
            this.usersRepository.count({ where: { role: 'player' } }),
            this.usersRepository.count({ where: { role: 'partner' } }),
            this.usersRepository.count({ where: { role: 'admin' } }),
            this.usersRepository.count({ where: { blocked: true } }),
        ]);

        // Count users created today
        const newToday = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.createdAt >= :today', { today })
            .getCount();

        return { total, players, partners, admins, blocked, newToday };
    }

    async updateStats(id: string, stats: { goals: number; assists: number; isMvp: boolean }): Promise<User> {
        const user = await this.findOneById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.totalGoals += stats.goals;
        user.totalAssists += stats.assists;
        if (stats.isMvp) {
            user.manOfTheMatchCount += 1;
        }
        user.gamesPlayed += 1;

        return this.usersRepository.save(user);
    }

    async incrementMvpCount(id: string): Promise<void> {
        const user = await this.findOneById(id);
        if (user) {
            user.manOfTheMatchCount += 1;
            await this.usersRepository.save(user);
        }
    }

    async search(query: string, page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
        const skip = (page - 1) * limit;
        const [users, total] = await this.usersRepository.findAndCount({
            where: [
                { email: ILike(`%${query}%`) },
                { name: ILike(`%${query}%`) }
            ],
            skip,
            take: limit,
            order: { name: 'ASC' }
        });

        return { users, total };
    }

    // Search players with filters and pagination
    async searchPlayers(filters: {
        query?: string;
        position?: string;
        skillLevel?: string;
        minAge?: number;
        maxAge?: number;
        minRating?: number;
        sortBy?: string;
        page?: number;
        limit?: number;
    }): Promise<{ users: User[], total: number, page: number, totalPages: number }> {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;

        const queryBuilder = this.usersRepository.createQueryBuilder('user')
            .where('user.blocked = :blocked', { blocked: false })
            .andWhere('user.role = :role', { role: 'player' });

        // Name search
        if (filters.query) {
            queryBuilder.andWhere('(user.name ILIKE :query OR user.email ILIKE :query)', {
                query: `%${filters.query}%`
            });
        }

        // Position filter
        if (filters.position) {
            queryBuilder.andWhere('user.position = :position', { position: filters.position });
        }

        // Skill level filter
        if (filters.skillLevel) {
            queryBuilder.andWhere('user.skillLevel = :skillLevel', { skillLevel: filters.skillLevel });
        }

        // Age filter
        if (filters.minAge || filters.maxAge) {
            const currentYear = new Date().getFullYear();
            if (filters.minAge) {
                const maxBirthYear = currentYear - filters.minAge;
                queryBuilder.andWhere('(user.age IS NULL OR user.age >= :minAge)', { minAge: filters.minAge });
            }
            if (filters.maxAge) {
                const minBirthYear = currentYear - filters.maxAge;
                queryBuilder.andWhere('(user.age IS NULL OR user.age <= :maxAge)', { maxAge: filters.maxAge });
            }
        }

        // Minimum rating filter
        if (filters.minRating && filters.minRating > 0) {
            queryBuilder.andWhere('user.averageRating >= :minRating', { minRating: filters.minRating });
        }

        // Sorting
        switch (filters.sortBy) {
            case 'rating':
                queryBuilder.orderBy('user.averageRating', 'DESC', 'NULLS LAST');
                break;
            case 'games':
                queryBuilder.orderBy('user.gamesPlayed', 'DESC', 'NULLS LAST');
                break;
            case 'goals':
                queryBuilder.orderBy('user.totalGoals', 'DESC', 'NULLS LAST');
                break;
            case 'name':
                queryBuilder.orderBy('user.name', 'ASC', 'NULLS LAST');
                break;
            default:
                queryBuilder.orderBy('user.averageRating', 'DESC', 'NULLS LAST');
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Apply pagination
        const users = await queryBuilder
            .skip(skip)
            .take(limit)
            .getMany();

        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    // Smart Invite: Advanced search with scoring algorithm
    async smartSearch(filters: {
        skillLevel?: string;
        district?: string;
        minAge?: number;
        maxAge?: number;
        preferredTime?: string;
        positions?: string[];
        excludeIds?: string[];
        limit?: number;
    }): Promise<{ users: User[], scores: Record<string, number> }> {
        const queryBuilder = this.usersRepository.createQueryBuilder('user')
            .where('user.blocked = :blocked', { blocked: false })
            .andWhere('user.role = :role', { role: 'player' });

        // Filter by positions
        if (filters.positions && filters.positions.length > 0) {
            queryBuilder.andWhere('user.position IN (:...positions)', { positions: filters.positions });
        }

        // Filter by skill level
        if (filters.skillLevel) {
            queryBuilder.andWhere('user.skillLevel = :skillLevel', { skillLevel: filters.skillLevel });
        }

        // Filter by district
        if (filters.district) {
            queryBuilder.andWhere('user.district = :district', { district: filters.district });
        }

        // Filter by age range
        if (filters.minAge || filters.maxAge) {
            if (filters.minAge) {
                queryBuilder.andWhere('user.age >= :minAge', { minAge: filters.minAge });
            }
            if (filters.maxAge) {
                queryBuilder.andWhere('user.age <= :maxAge', { maxAge: filters.maxAge });
            }
        }

        // Exclude specific user IDs (e.g., already invited or joined)
        if (filters.excludeIds && filters.excludeIds.length > 0) {
            queryBuilder.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds: filters.excludeIds });
        }

        // Get initial pool of users
        const users = await queryBuilder
            .orderBy('user.lastPlayedAt', 'DESC', 'NULLS LAST')
            .take(filters.limit || 100)
            .getMany();

        // Calculate scores for each user (for smart invite ranking)
        const scores: Record<string, number> = {};
        const now = new Date();

        for (const user of users) {
            let score = 50; // Base score

            // Factor 1: Recent activity (max +20)
            if (user.lastPlayedAt) {
                const daysSinceLastPlay = Math.floor((now.getTime() - new Date(user.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceLastPlay < 7) score += 20;
                else if (daysSinceLastPlay < 14) score += 15;
                else if (daysSinceLastPlay < 30) score += 10;
                else if (daysSinceLastPlay > 60) score += 5; // Retargeting bonus for inactive users
            }

            // Factor 2: Play frequency in preferred time (max +15)
            if (filters.preferredTime && user.playFrequency) {
                const freq = (user.playFrequency as any)[filters.preferredTime] || 0;
                score += Math.min(freq * 2, 15);
            }

            // Factor 3: Games played (experience) (max +10)
            if (user.gamesPlayed > 0) {
                score += Math.min(user.gamesPlayed / 5, 10);
            }

            // Factor 4: High rating (max +5)
            if (user.averageRating >= 4) score += 5;
            else if (user.averageRating >= 3) score += 3;

            scores[user.id] = Math.round(score);
        }

        // Sort by score descending
        users.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

        // Return top N users
        const topUsers = users.slice(0, filters.limit || 30);

        return { users: topUsers, scores };
    }

    // Team Balancer: Get batch of users with MMR ratings
    async getBatchRatings(userIds: string[]): Promise<Array<{
        id: string;
        name: string;
        avatar: string;
        mmr: number;
        attackRating: number;
        defenseRating: number;
    }>> {
        if (userIds.length === 0) return [];

        const users = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...userIds)', { userIds })
            .getMany();

        return users.map(user => ({
            id: user.id,
            name: user.name || 'Unknown',
            avatar: user.avatar || '',
            mmr: this.calculateMMR(user),
            attackRating: user.attackRating || 50,
            defenseRating: user.defenseRating || 50,
        }));
    }

    // Get batch of users with full details
    async getBatchUsers(userIds: string[]): Promise<User[]> {
        if (!userIds || userIds.length === 0) return [];

        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...userIds)', { userIds })
            .select(['user.id', 'user.name', 'user.email', 'user.avatar', 'user.position', 'user.skillLevel', 'user.averageRating'])
            .getMany();
    }

    // Calculate MMR (Match Making Rating) for team balancing
    calculateMMR(user: User): number {
        const attackWeight = 0.35;
        const defenseWeight = 0.25;
        const staminaWeight = 0.15;
        const speedWeight = 0.10;
        const experienceWeight = 0.15;

        // Get ratings with defaults
        const attack = user.attackRating || 50;
        const defense = user.defenseRating || 50;
        const stamina = user.staminaRating || 50;
        const speed = user.speedRating || 50;

        // Experience factor: games played normalized (max contribution at 100 games)
        const expFactor = Math.min((user.gamesPlayed || 0) / 100, 1) * 100;

        // Calculate weighted MMR
        const mmr = (
            attack * attackWeight +
            defense * defenseWeight +
            stamina * staminaWeight +
            speed * speedWeight +
            expFactor * experienceWeight
        );

        return Math.round(mmr);
    }

    // Update user's play activity after joining/finishing a game
    async updatePlayActivity(userId: string, gameTime: string): Promise<void> {
        const user = await this.findOneById(userId);
        if (!user) return;

        // Update last played date
        user.lastPlayedAt = new Date();

        // Update play frequency for this time slot
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const timeSlot = `${dayOfWeek}_${gameTime.includes('evening') ? 'evening' : gameTime.includes('morning') ? 'morning' : 'afternoon'}`;

        const frequency = (user.playFrequency || {}) as Record<string, number>;
        frequency[timeSlot] = (frequency[timeSlot] || 0) + 1;
        user.playFrequency = frequency;

        await this.usersRepository.save(user);
    }

    // Claim PWA install bonus (1 AZN, one-time)
    async claimInstallBonus(userId: string): Promise<{ success: boolean; balance: number; message: string }> {
        const user = await this.findOneById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (user.installBonusReceived) {
            return { success: false, balance: user.balance, message: 'Бонус за установку уже получен' };
        }

        user.installBonusReceived = true;
        user.balance = (user.balance || 0) + 1.00; // 1 AZN install bonus
        await this.usersRepository.save(user);

        return { success: true, balance: user.balance, message: '🎉 +1 AZN за установку приложения!' };
    }

    // Claim profile completion bonus (0.50 AZN, one-time)
    async claimProfileBonus(userId: string): Promise<{ success: boolean; balance: number; message: string }> {
        const user = await this.findOneById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (user.profileBonusReceived) {
            return { success: false, balance: user.balance, message: 'Бонус за профиль уже получен' };
        }

        // Check if profile is actually complete
        const isComplete = this.checkProfileCompletion(user);
        if (!isComplete) {
            return { success: false, balance: user.balance, message: 'Сначала заполните профиль полностью' };
        }

        user.profileBonusReceived = true;
        user.profileCompleted = true;
        user.balance = (user.balance || 0) + 0.50; // 0.50 AZN profile bonus
        await this.usersRepository.save(user);

        return { success: true, balance: user.balance, message: '🎉 +0.50 AZN за заполнение профиля!' };
    }

    // Check if profile has all required fields completed
    checkProfileCompletion(user: User): boolean {
        return !!(
            user.name &&
            user.position &&
            user.skillLevel &&
            user.preferredFoot &&
            user.height &&
            user.weight &&
            user.avatar
        );
    }

    // Get profile completion percentage
    getProfileCompletionPercentage(user: User): { percentage: number; missingFields: string[] } {
        const fields = [
            { key: 'name', label: 'Имя' },
            { key: 'position', label: 'Позиция' },
            { key: 'skillLevel', label: 'Уровень' },
            { key: 'preferredFoot', label: 'Рабочая нога' },
            { key: 'height', label: 'Рост' },
            { key: 'weight', label: 'Вес' },
            { key: 'avatar', label: 'Фото' },
        ];

        const missingFields: string[] = [];
        let completed = 0;

        for (const field of fields) {
            if ((user as any)[field.key]) {
                completed++;
            } else {
                missingFields.push(field.label);
            }
        }

        return {
            percentage: Math.round((completed / fields.length) * 100),
            missingFields
        };
    }

    // Apply skill badges to user ratings (from post-game voting + auto-correction)
    async applyBadges(userId: string, badges: Record<string, number>): Promise<{ success: boolean; updates: Record<string, number> }> {
        const user = await this.findOneById(userId);
        if (!user) {
            return { success: false, updates: {} };
        }

        const BADGE_TO_RATING: Record<string, string> = {
            speed: 'speedRating',
            defense: 'defenseRating',
            stamina: 'staminaRating',
            attack: 'attackRating',
        };

        const MAX_RATING = 95;
        const updates: Record<string, number> = {};

        if (!user.receivedBadges) user.receivedBadges = {};

        for (const [badgeType, count] of Object.entries(badges)) {
            // Track badge counts
            user.receivedBadges[badgeType] = (user.receivedBadges[badgeType] || 0) + count;

            const field = BADGE_TO_RATING[badgeType];
            if (!field) continue;

            const current = (user as any)[field] || 50;
            const newVal = Math.min(current + count, MAX_RATING);
            (user as any)[field] = newVal;
            updates[field] = newVal;
        }

        await this.usersRepository.save(user);

        return { success: true, updates };
    }

    // Secure Balance Transfer with ACID Transaction
    async transferBalance(senderId: string, receiverId: string, amount: number, note?: string): Promise<Transaction> {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');
        if (senderId === receiverId) throw new BadRequestException('Cannot transfer to yourself');

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const sender = await queryRunner.manager.findOne(User, { where: { id: senderId }, lock: { mode: 'pessimistic_write' } });
            const receiver = await queryRunner.manager.findOne(User, { where: { id: receiverId }, lock: { mode: 'pessimistic_write' } });

            if (!sender) throw new NotFoundException('Sender not found');
            if (!receiver) throw new NotFoundException('Receiver not found');

            if ((sender.balance || 0) < amount) {
                throw new BadRequestException('Insufficient balance');
            }

            // Update balances
            sender.balance -= amount;
            receiver.balance = (receiver.balance || 0) + amount;

            await queryRunner.manager.save(sender);
            await queryRunner.manager.save(receiver);

            // Create transaction record
            const transaction = queryRunner.manager.create(Transaction, {
                senderId,
                receiverId,
                amount,
                note,
                status: 'completed'
            });

            const savedTransaction = await queryRunner.manager.save(transaction);

            await queryRunner.commitTransaction();
            return savedTransaction;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }



    async getRevenueStats(): Promise<{ today: number; week: number; total: number; txCount: number }> {
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0);

        const [todayRes, weekRes, totalRes, txCount] = await Promise.all([
            this.transactionsRepository
                .createQueryBuilder('tx')
                .select('COALESCE(SUM(tx.amount), 0)', 'sum')
                .where('tx.createdAt >= :start', { start: todayStart })
                .getRawOne(),
            this.transactionsRepository
                .createQueryBuilder('tx')
                .select('COALESCE(SUM(tx.amount), 0)', 'sum')
                .where('tx.createdAt >= :start', { start: weekStart })
                .getRawOne(),
            this.transactionsRepository
                .createQueryBuilder('tx')
                .select('COALESCE(SUM(tx.amount), 0)', 'sum')
                .getRawOne(),
            this.transactionsRepository.count(),
        ]);

        return {
            today: parseFloat(todayRes?.sum || '0'),
            week: parseFloat(weekRes?.sum || '0'),
            total: parseFloat(totalRes?.sum || '0'),
            txCount,
        };
    }

    async findRecent(limit: number = 10): Promise<User[]> {
        return this.usersRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
            select: ['id', 'name', 'email', 'phone', 'role', 'blocked', 'createdAt', 'gamesPlayed', 'balance'],
        });
    }

    async getTransactionHistory(userId: string): Promise<Transaction[]> {
        return this.transactionsRepository.find({
            where: [
                { senderId: userId },
                { receiverId: userId }
            ],
            order: { createdAt: 'DESC' }
        });
    }

    // ============= NO-SHOW & WARNING SYSTEM =============

    async incrementNoShowCount(userId: string): Promise<{ noShowCount: number; warned: boolean }> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.noShowCount = (user.noShowCount || 0) + 1;

        let warned = false;
        if (user.noShowCount === 3) {
            user.warningCount = (user.warningCount || 0) + 1;
            warned = true;
        }
        if (user.noShowCount >= 5 && !user.blocked) {
            user.blocked = true;
            user.blockedReason = `Автоблокировка: ${user.noShowCount} неявок на игры`;
            user.blockedAt = new Date();
        }

        await this.usersRepository.save(user);
        return { noShowCount: user.noShowCount, warned };
    }

    async addWarning(userId: string, reason: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.warningCount = (user.warningCount || 0) + 1;
        if (user.warningCount >= 3 && !user.blocked) {
            user.blocked = true;
            user.blockedReason = reason || 'Превышен лимит предупреждений';
            user.blockedAt = new Date();
        }

        return this.usersRepository.save(user);
    }

    // ============= FRIENDSHIP SYSTEM =============

    async sendFriendRequest(requesterId: string, receiverId: string): Promise<Friendship> {
        if (requesterId === receiverId) throw new BadRequestException('Cannot friend yourself');

        const existing = await this.friendshipsRepository.findOne({
            where: [
                { requesterId, receiverId },
                { requesterId: receiverId, receiverId: requesterId }
            ]
        });

        if (existing) {
            if (existing.status === 'pending') throw new BadRequestException('Request already pending');
            if (existing.status === 'accepted') throw new BadRequestException('Already friends');
            // If rejected, allow re-request? Maybe.
        }

        const requester = await this.usersRepository.findOne({ where: { id: requesterId } });

        const friendship = this.friendshipsRepository.create({
            requesterId,
            receiverId,
            status: 'pending'
        });

        const saved = await this.friendshipsRepository.save(friendship);

        try {
            await this.notificationsService.sendNotification(
                receiverId,
                'FRIEND_REQUEST',
                'Новый запрос в друзья',
                `${requester?.name || 'Игрок'} хочет добавить вас в друзья.`,
            );
        } catch (e) {
            console.error('Failed to notify friend request receiver:', e.message);
        }

        return saved;
    }

    async respondToFriendRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<Friendship> {
        const request = await this.friendshipsRepository.findOne({ where: { id: requestId } });
        if (!request) throw new NotFoundException('Request not found');

        request.status = status;
        const saved = await this.friendshipsRepository.save(request);

        const responder = await this.usersRepository.findOne({ where: { id: request.receiverId } });

        try {
            if (status === 'accepted') {
                await this.notificationsService.sendNotification(
                    request.requesterId,
                    'FRIEND_ACCEPTED',
                    'Запрос принят',
                    `${responder?.name || 'Игрок'} принял ваш запрос в друзья.`,
                );
            } else {
                await this.notificationsService.sendNotification(
                    request.requesterId,
                    'FRIEND_REJECTED',
                    'Запрос отклонён',
                    `${responder?.name || 'Игрок'} отклонил ваш запрос в друзья.`,
                );
            }
        } catch (e) {
            console.error('Failed to notify friend request sender:', e.message);
        }

        return saved;
    }

    async getFriends(userId: string): Promise<User[]> {
        const friendships = await this.friendshipsRepository.find({
            where: [
                { requesterId: userId, status: 'accepted' },
                { receiverId: userId, status: 'accepted' }
            ]
        });

        const friendIds = friendships.map(f => f.requesterId === userId ? f.receiverId : f.requesterId);

        if (friendIds.length === 0) return [];

        return this.usersRepository.find({ where: { id: In(friendIds) } });
    }

    async getPendingRequests(userId: string): Promise<any[]> {
        // Incoming requests
        const requests = await this.friendshipsRepository.find({
            where: { receiverId: userId, status: 'pending' }
        });

        // Enrich with requester data
        const enriched = await Promise.all(requests.map(async req => {
            const user = await this.usersRepository.findOne({ where: { id: req.requesterId } });
            return { ...req, sender: user };
        }));

        return enriched;
    }

    async getFriendshipStatus(userId: string, targetId: string): Promise<{ status: string; requestId?: string; isSender?: boolean }> {
        const friendship = await this.friendshipsRepository.findOne({
            where: [
                { requesterId: userId, receiverId: targetId },
                { requesterId: targetId, receiverId: userId }
            ]
        });

        if (!friendship) return { status: 'none' };

        return {
            status: friendship.status,
            requestId: friendship.id,
            isSender: friendship.requesterId === userId
        };
    }

    async removeFriend(userId: string, targetId: string): Promise<void> {
        const friendship = await this.friendshipsRepository.findOne({
            where: [
                { requesterId: userId, receiverId: targetId },
                { requesterId: targetId, receiverId: userId },
            ],
        });
        if (!friendship) throw new NotFoundException('Friendship not found');
        await this.friendshipsRepository.remove(friendship);
    }

    // ============= REFERRAL SYSTEM =============

    async getReferralInfo(userId: string): Promise<{
        referralCode: string;
        referralLink: string;
        referredCount: number;
        totalEarned: number;
    }> {
        const user = await this.findOneById(userId);
        if (!user) throw new NotFoundException('User not found');

        const referredCount = await this.usersRepository.count({
            where: { referredBy: userId }
        });

        return {
            referralCode: user.referralCode || '',
            referralLink: `https://topaz.az/register?ref=${user.referralCode || ''}`,
            referredCount,
            totalEarned: referredCount * 1,
        };
    }

    async processReferral(newUserId: string, referralCode: string): Promise<{ success: boolean }> {
        const newUser = await this.findOneById(newUserId);
        if (!newUser) throw new NotFoundException('User not found');

        const referrer = await this.usersRepository.findOne({ where: { referralCode } });
        if (!referrer || referrer.id === newUserId) {
            return { success: false };
        }

        newUser.referredBy = referrer.id;
        newUser.balance = (newUser.balance || 0) + 0.5;
        await this.usersRepository.save(newUser);

        return { success: true };
    }

    async payReferrerBonus(userId: string): Promise<{ paid: boolean }> {
        const user = await this.findOneById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (!user.referredBy || user.referralBonusPaid) {
            return { paid: false };
        }

        const referrer = await this.findOneById(user.referredBy);
        if (!referrer) return { paid: false };

        referrer.balance = (referrer.balance || 0) + 1;
        user.referralBonusPaid = true;

        await this.usersRepository.save(referrer);
        await this.usersRepository.save(user);

        return { paid: true };
    }

    // ============= PHONE VERIFICATION BONUS =============

    private isAzerbaijaniPhone(phone: string): boolean {
        return /^(\+994|994)(10|40|50|51|55|60|70|77|99)\d{7}$/.test(phone.replace(/\s/g, ''));
    }

    async markPhoneVerificationPending(userId: string): Promise<'auto_format' | 'pending'> {
        const user = await this.findOneById(userId);
        if (!user || user.phoneBonusPaid) return 'pending';

        user.phoneVerificationRequestedAt = new Date();
        await this.usersRepository.save(user);

        // Return whether it's an AZ-format number (affects Telegram message style)
        if (user.phone && this.isAzerbaijaniPhone(user.phone)) {
            return 'auto_format';
        }
        return 'pending';
    }

    async approvePhoneBonus(userId: string): Promise<{ success: boolean }> {
        const user = await this.findOneById(userId);
        if (!user || user.phoneBonusPaid) return { success: false };

        user.balance = (user.balance || 0) + 2;
        user.phoneBonusPaid = true;
        user.phoneVerificationRequestedAt = null;
        await this.usersRepository.save(user);

        const notifMsg = 'Nömrəniz təsdiqləndi. Hesabınıza +2 ₼ bonus əlavə edildi.';
        try {
            await this.notificationsService.sendNotification(
                userId, 'SYSTEM',
                '📱 Telefon təsdiqləndi!',
                notifMsg,
            );
        } catch {}

        // Create support ticket so user sees it in the app
        try {
            await this.supportTicketRepo.save(this.supportTicketRepo.create({
                userId,
                userName: user.name || '—',
                userEmail: user.email,
                message: '📱 Telefon nömrəniz uğurla təsdiqləndi. Hesabınıza +2 ₼ bonus əlavə edildi.',
                status: 'replied',
                reply: 'Hesabınıza +2 ₼ bonus köçürüldü. Təşəkkür edirik!',
            }));
        } catch {}

        return { success: true };
    }

    async rejectPhone(userId: string): Promise<void> {
        const user = await this.findOneById(userId);
        if (!user) return;

        user.phoneVerificationRequestedAt = null;
        await this.usersRepository.save(user);

        const notifMsg = 'Daxil etdiyiniz nömrə doğrulanamadı. Zəhmət olmasa profil parametrlərindən düzgün nömrəni daxil edin.';
        try {
            await this.notificationsService.sendNotification(
                userId, 'SYSTEM',
                '❌ Telefon təsdiqlənmədi',
                notifMsg,
            );
        } catch {}

        // Create support ticket so user sees it in the app
        try {
            await this.supportTicketRepo.save(this.supportTicketRepo.create({
                userId,
                userName: user.name || '—',
                userEmail: user.email,
                message: '❌ Telefon nömrəniz təsdiqlənmədi.',
                status: 'replied',
                reply: 'Daxil etdiyiniz nömrə doğrulanamadı. Profil parametrlərindən düzgün Azərbaycan nömrəsini daxil edin.',
            }));
        } catch {}
    }

    async autoApproveExpiredPhoneVerifications(): Promise<void> {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
        const pending = await this.usersRepository
            .createQueryBuilder('u')
            .where('u.phoneVerificationRequestedAt IS NOT NULL')
            .andWhere('u.phoneVerificationRequestedAt < :cutoff', { cutoff })
            .andWhere('u.phoneBonusPaid = false')
            .getMany();

        for (const user of pending) {
            await this.approvePhoneBonus(user.id);
        }
    }
}

