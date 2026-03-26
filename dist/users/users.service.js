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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const transaction_entity_1 = require("./entities/transaction.entity");
const friendship_entity_1 = require("./entities/friendship.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let UsersService = class UsersService {
    constructor(usersRepository, transactionsRepository, friendshipsRepository, dataSource, notificationsService) {
        this.usersRepository = usersRepository;
        this.transactionsRepository = transactionsRepository;
        this.friendshipsRepository = friendshipsRepository;
        this.dataSource = dataSource;
        this.notificationsService = notificationsService;
    }
    async findOneByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findOneByPhone(phone) {
        return this.usersRepository.findOne({ where: { phone } });
    }
    async findOneById(id) {
        return this.usersRepository.findOne({
            where: { id },
            relations: ['achievements']
        });
    }
    generateReferralCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    async create(userData) {
        const user = this.usersRepository.create(userData);
        user.balance = 1.00;
        let referralCode = this.generateReferralCode();
        while (await this.usersRepository.findOne({ where: { referralCode } })) {
            referralCode = this.generateReferralCode();
        }
        user.referralCode = referralCode;
        return this.usersRepository.save(user);
    }
    async update(id, userData) {
        const { achievements, id: userId, email, password, createdAt, ...updateableData } = userData;
        await this.usersRepository.update(id, updateableData);
        const updatedUser = await this.findOneById(id);
        if (!updatedUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return updatedUser;
    }
    async updateFcmToken(id, token) {
        await this.usersRepository.update(id, { fcmToken: token });
    }
    async updateBalance(id, amount) {
        const user = await this.findOneById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.balance = (user.balance || 0) + amount;
        if (user.balance < 0) {
            throw new common_1.BadRequestException('Insufficient funds');
        }
        await this.usersRepository.save(user);
        return { id: user.id, balance: user.balance };
    }
    async findAll(page = 1, limit = 20, role) {
        const skip = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        const [users, total] = await this.usersRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
            select: ['id', 'email', 'name', 'phone', 'role', 'blocked', 'createdAt', 'gamesPlayed', 'averageRating', 'balance']
        });
        return { users, total };
    }
    async blockUser(id, reason) {
        const user = await this.findOneById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.blocked = true;
        user.blockedReason = reason;
        user.blockedAt = new Date();
        return this.usersRepository.save(user);
    }
    async unblockUser(id) {
        const user = await this.findOneById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.blocked = false;
        user.blockedReason = null;
        user.blockedAt = null;
        return this.usersRepository.save(user);
    }
    async changeRole(id, role) {
        const user = await this.findOneById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.role = role;
        return this.usersRepository.save(user);
    }
    async deleteUser(id) {
        await this.usersRepository.delete(id);
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [total, players, partners, admins, blocked] = await Promise.all([
            this.usersRepository.count(),
            this.usersRepository.count({ where: { role: 'player' } }),
            this.usersRepository.count({ where: { role: 'partner' } }),
            this.usersRepository.count({ where: { role: 'admin' } }),
            this.usersRepository.count({ where: { blocked: true } }),
        ]);
        const newToday = await this.usersRepository
            .createQueryBuilder('user')
            .where('user.createdAt >= :today', { today })
            .getCount();
        return { total, players, partners, admins, blocked, newToday };
    }
    async updateStats(id, stats) {
        const user = await this.findOneById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        user.totalGoals += stats.goals;
        user.totalAssists += stats.assists;
        if (stats.isMvp) {
            user.manOfTheMatchCount += 1;
        }
        user.gamesPlayed += 1;
        return this.usersRepository.save(user);
    }
    async incrementMvpCount(id) {
        const user = await this.findOneById(id);
        if (user) {
            user.manOfTheMatchCount += 1;
            await this.usersRepository.save(user);
        }
    }
    async search(query, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await this.usersRepository.findAndCount({
            where: [
                { email: (0, typeorm_2.ILike)(`%${query}%`) },
                { name: (0, typeorm_2.ILike)(`%${query}%`) }
            ],
            skip,
            take: limit,
            order: { name: 'ASC' }
        });
        return { users, total };
    }
    async searchPlayers(filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.usersRepository.createQueryBuilder('user')
            .where('user.blocked = :blocked', { blocked: false })
            .andWhere('user.role = :role', { role: 'player' });
        if (filters.query) {
            queryBuilder.andWhere('(user.name ILIKE :query OR user.email ILIKE :query)', {
                query: `%${filters.query}%`
            });
        }
        if (filters.position) {
            queryBuilder.andWhere('user.position = :position', { position: filters.position });
        }
        if (filters.skillLevel) {
            queryBuilder.andWhere('user.skillLevel = :skillLevel', { skillLevel: filters.skillLevel });
        }
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
        if (filters.minRating && filters.minRating > 0) {
            queryBuilder.andWhere('user.averageRating >= :minRating', { minRating: filters.minRating });
        }
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
        const total = await queryBuilder.getCount();
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
    async smartSearch(filters) {
        const queryBuilder = this.usersRepository.createQueryBuilder('user')
            .where('user.blocked = :blocked', { blocked: false })
            .andWhere('user.role = :role', { role: 'player' });
        if (filters.positions && filters.positions.length > 0) {
            queryBuilder.andWhere('user.position IN (:...positions)', { positions: filters.positions });
        }
        if (filters.skillLevel) {
            queryBuilder.andWhere('user.skillLevel = :skillLevel', { skillLevel: filters.skillLevel });
        }
        if (filters.district) {
            queryBuilder.andWhere('user.district = :district', { district: filters.district });
        }
        if (filters.minAge || filters.maxAge) {
            if (filters.minAge) {
                queryBuilder.andWhere('user.age >= :minAge', { minAge: filters.minAge });
            }
            if (filters.maxAge) {
                queryBuilder.andWhere('user.age <= :maxAge', { maxAge: filters.maxAge });
            }
        }
        if (filters.excludeIds && filters.excludeIds.length > 0) {
            queryBuilder.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds: filters.excludeIds });
        }
        const users = await queryBuilder
            .orderBy('user.lastPlayedAt', 'DESC', 'NULLS LAST')
            .take(filters.limit || 100)
            .getMany();
        const scores = {};
        const now = new Date();
        for (const user of users) {
            let score = 50;
            if (user.lastPlayedAt) {
                const daysSinceLastPlay = Math.floor((now.getTime() - new Date(user.lastPlayedAt).getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceLastPlay < 7)
                    score += 20;
                else if (daysSinceLastPlay < 14)
                    score += 15;
                else if (daysSinceLastPlay < 30)
                    score += 10;
                else if (daysSinceLastPlay > 60)
                    score += 5;
            }
            if (filters.preferredTime && user.playFrequency) {
                const freq = user.playFrequency[filters.preferredTime] || 0;
                score += Math.min(freq * 2, 15);
            }
            if (user.gamesPlayed > 0) {
                score += Math.min(user.gamesPlayed / 5, 10);
            }
            if (user.averageRating >= 4)
                score += 5;
            else if (user.averageRating >= 3)
                score += 3;
            scores[user.id] = Math.round(score);
        }
        users.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
        const topUsers = users.slice(0, filters.limit || 30);
        return { users: topUsers, scores };
    }
    async getBatchRatings(userIds) {
        if (userIds.length === 0)
            return [];
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
    async getBatchUsers(userIds) {
        if (!userIds || userIds.length === 0)
            return [];
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...userIds)', { userIds })
            .select(['user.id', 'user.name', 'user.email', 'user.avatar', 'user.position', 'user.skillLevel', 'user.averageRating'])
            .getMany();
    }
    calculateMMR(user) {
        const attackWeight = 0.35;
        const defenseWeight = 0.25;
        const staminaWeight = 0.15;
        const speedWeight = 0.10;
        const experienceWeight = 0.15;
        const attack = user.attackRating || 50;
        const defense = user.defenseRating || 50;
        const stamina = user.staminaRating || 50;
        const speed = user.speedRating || 50;
        const expFactor = Math.min((user.gamesPlayed || 0) / 100, 1) * 100;
        const mmr = (attack * attackWeight +
            defense * defenseWeight +
            stamina * staminaWeight +
            speed * speedWeight +
            expFactor * experienceWeight);
        return Math.round(mmr);
    }
    async updatePlayActivity(userId, gameTime) {
        const user = await this.findOneById(userId);
        if (!user)
            return;
        user.lastPlayedAt = new Date();
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const timeSlot = `${dayOfWeek}_${gameTime.includes('evening') ? 'evening' : gameTime.includes('morning') ? 'morning' : 'afternoon'}`;
        const frequency = (user.playFrequency || {});
        frequency[timeSlot] = (frequency[timeSlot] || 0) + 1;
        user.playFrequency = frequency;
        await this.usersRepository.save(user);
    }
    async claimInstallBonus(userId) {
        const user = await this.findOneById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.installBonusReceived) {
            return { success: false, balance: user.balance, message: 'Бонус за установку уже получен' };
        }
        user.installBonusReceived = true;
        user.balance = (user.balance || 0) + 1.00;
        await this.usersRepository.save(user);
        return { success: true, balance: user.balance, message: '🎉 +1 AZN за установку приложения!' };
    }
    async claimProfileBonus(userId) {
        const user = await this.findOneById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.profileBonusReceived) {
            return { success: false, balance: user.balance, message: 'Бонус за профиль уже получен' };
        }
        const isComplete = this.checkProfileCompletion(user);
        if (!isComplete) {
            return { success: false, balance: user.balance, message: 'Сначала заполните профиль полностью' };
        }
        user.profileBonusReceived = true;
        user.profileCompleted = true;
        user.balance = (user.balance || 0) + 0.50;
        await this.usersRepository.save(user);
        return { success: true, balance: user.balance, message: '🎉 +0.50 AZN за заполнение профиля!' };
    }
    checkProfileCompletion(user) {
        return !!(user.name &&
            user.position &&
            user.skillLevel &&
            user.preferredFoot &&
            user.height &&
            user.weight &&
            user.avatar);
    }
    getProfileCompletionPercentage(user) {
        const fields = [
            { key: 'name', label: 'Имя' },
            { key: 'position', label: 'Позиция' },
            { key: 'skillLevel', label: 'Уровень' },
            { key: 'preferredFoot', label: 'Рабочая нога' },
            { key: 'height', label: 'Рост' },
            { key: 'weight', label: 'Вес' },
            { key: 'avatar', label: 'Фото' },
        ];
        const missingFields = [];
        let completed = 0;
        for (const field of fields) {
            if (user[field.key]) {
                completed++;
            }
            else {
                missingFields.push(field.label);
            }
        }
        return {
            percentage: Math.round((completed / fields.length) * 100),
            missingFields
        };
    }
    async applyBadges(userId, badges) {
        const user = await this.findOneById(userId);
        if (!user) {
            return { success: false, updates: {} };
        }
        const BADGE_TO_RATING = {
            speed: 'speedRating',
            defense: 'defenseRating',
            stamina: 'staminaRating',
            attack: 'attackRating',
        };
        const MAX_RATING = 95;
        const updates = {};
        if (!user.receivedBadges)
            user.receivedBadges = {};
        for (const [badgeType, count] of Object.entries(badges)) {
            user.receivedBadges[badgeType] = (user.receivedBadges[badgeType] || 0) + count;
            const field = BADGE_TO_RATING[badgeType];
            if (!field)
                continue;
            const current = user[field] || 50;
            const newVal = Math.min(current + count, MAX_RATING);
            user[field] = newVal;
            updates[field] = newVal;
        }
        await this.usersRepository.save(user);
        return { success: true, updates };
    }
    async transferBalance(senderId, receiverId, amount, note) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        if (senderId === receiverId)
            throw new common_1.BadRequestException('Cannot transfer to yourself');
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const sender = await queryRunner.manager.findOne(user_entity_1.User, { where: { id: senderId }, lock: { mode: 'pessimistic_write' } });
            const receiver = await queryRunner.manager.findOne(user_entity_1.User, { where: { id: receiverId }, lock: { mode: 'pessimistic_write' } });
            if (!sender)
                throw new common_1.NotFoundException('Sender not found');
            if (!receiver)
                throw new common_1.NotFoundException('Receiver not found');
            if ((sender.balance || 0) < amount) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            sender.balance -= amount;
            receiver.balance = (receiver.balance || 0) + amount;
            await queryRunner.manager.save(sender);
            await queryRunner.manager.save(receiver);
            const transaction = queryRunner.manager.create(transaction_entity_1.Transaction, {
                senderId,
                receiverId,
                amount,
                note,
                status: 'completed'
            });
            const savedTransaction = await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return savedTransaction;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getTransactionHistory(userId) {
        return this.transactionsRepository.find({
            where: [
                { senderId: userId },
                { receiverId: userId }
            ],
            order: { createdAt: 'DESC' }
        });
    }
    async incrementNoShowCount(userId) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
    async addWarning(userId, reason) {
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.warningCount = (user.warningCount || 0) + 1;
        if (user.warningCount >= 3 && !user.blocked) {
            user.blocked = true;
            user.blockedReason = reason || 'Превышен лимит предупреждений';
            user.blockedAt = new Date();
        }
        return this.usersRepository.save(user);
    }
    async sendFriendRequest(requesterId, receiverId) {
        if (requesterId === receiverId)
            throw new common_1.BadRequestException('Cannot friend yourself');
        const existing = await this.friendshipsRepository.findOne({
            where: [
                { requesterId, receiverId },
                { requesterId: receiverId, receiverId: requesterId }
            ]
        });
        if (existing) {
            if (existing.status === 'pending')
                throw new common_1.BadRequestException('Request already pending');
            if (existing.status === 'accepted')
                throw new common_1.BadRequestException('Already friends');
        }
        const requester = await this.usersRepository.findOne({ where: { id: requesterId } });
        const friendship = this.friendshipsRepository.create({
            requesterId,
            receiverId,
            status: 'pending'
        });
        const saved = await this.friendshipsRepository.save(friendship);
        try {
            await this.notificationsService.sendNotification(receiverId, 'FRIEND_REQUEST', 'Новый запрос в друзья', `${requester?.name || 'Игрок'} хочет добавить вас в друзья.`);
        }
        catch (e) {
            console.error('Failed to notify friend request receiver:', e.message);
        }
        return saved;
    }
    async respondToFriendRequest(requestId, status) {
        const request = await this.friendshipsRepository.findOne({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Request not found');
        request.status = status;
        const saved = await this.friendshipsRepository.save(request);
        const responder = await this.usersRepository.findOne({ where: { id: request.receiverId } });
        try {
            if (status === 'accepted') {
                await this.notificationsService.sendNotification(request.requesterId, 'FRIEND_ACCEPTED', 'Запрос принят', `${responder?.name || 'Игрок'} принял ваш запрос в друзья.`);
            }
            else {
                await this.notificationsService.sendNotification(request.requesterId, 'FRIEND_REJECTED', 'Запрос отклонён', `${responder?.name || 'Игрок'} отклонил ваш запрос в друзья.`);
            }
        }
        catch (e) {
            console.error('Failed to notify friend request sender:', e.message);
        }
        return saved;
    }
    async getFriends(userId) {
        const friendships = await this.friendshipsRepository.find({
            where: [
                { requesterId: userId, status: 'accepted' },
                { receiverId: userId, status: 'accepted' }
            ]
        });
        const friendIds = friendships.map(f => f.requesterId === userId ? f.receiverId : f.requesterId);
        if (friendIds.length === 0)
            return [];
        return this.usersRepository.find({ where: { id: (0, typeorm_2.In)(friendIds) } });
    }
    async getPendingRequests(userId) {
        const requests = await this.friendshipsRepository.find({
            where: { receiverId: userId, status: 'pending' }
        });
        const enriched = await Promise.all(requests.map(async (req) => {
            const user = await this.usersRepository.findOne({ where: { id: req.requesterId } });
            return { ...req, sender: user };
        }));
        return enriched;
    }
    async getFriendshipStatus(userId, targetId) {
        const friendship = await this.friendshipsRepository.findOne({
            where: [
                { requesterId: userId, receiverId: targetId },
                { requesterId: targetId, receiverId: userId }
            ]
        });
        if (!friendship)
            return { status: 'none' };
        return {
            status: friendship.status,
            requestId: friendship.id,
            isSender: friendship.requesterId === userId
        };
    }
    async removeFriend(userId, targetId) {
        const friendship = await this.friendshipsRepository.findOne({
            where: [
                { requesterId: userId, receiverId: targetId },
                { requesterId: targetId, receiverId: userId },
            ],
        });
        if (!friendship)
            throw new common_1.NotFoundException('Friendship not found');
        await this.friendshipsRepository.remove(friendship);
    }
    async getReferralInfo(userId) {
        const user = await this.findOneById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
    async processReferral(newUserId, referralCode) {
        const newUser = await this.findOneById(newUserId);
        if (!newUser)
            throw new common_1.NotFoundException('User not found');
        const referrer = await this.usersRepository.findOne({ where: { referralCode } });
        if (!referrer || referrer.id === newUserId) {
            return { success: false };
        }
        newUser.referredBy = referrer.id;
        newUser.balance = (newUser.balance || 0) + 0.5;
        await this.usersRepository.save(newUser);
        return { success: true };
    }
    async payReferrerBonus(userId) {
        const user = await this.findOneById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.referredBy || user.referralBonusPaid) {
            return { paid: false };
        }
        const referrer = await this.findOneById(user.referredBy);
        if (!referrer)
            return { paid: false };
        referrer.balance = (referrer.balance || 0) + 1;
        user.referralBonusPaid = true;
        await this.usersRepository.save(referrer);
        await this.usersRepository.save(user);
        return { paid: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(friendship_entity_1.Friendship)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        notifications_service_1.NotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map