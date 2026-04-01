import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Game } from './entities/game.entity';
import { GamePlayerStats } from './entities/game-player-stats.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { NoShow } from './entities/no-show.entity';
import { PlayerReport, ReportType, ReportStatus } from './entities/player-report.entity';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { StadiumsService } from '../stadiums/stadiums.service';
import { BookingsService } from '../bookings/bookings.service';
import { AchievementsService } from '../achievements/achievements.service';
import { RatingsService } from '../ratings/ratings.service';

@Injectable()
export class GamesService {
    constructor(
        @InjectRepository(Game)
        private gamesRepository: Repository<Game>,
        @InjectRepository(GamePlayerStats)
        private statsRepository: Repository<GamePlayerStats>,
        @InjectRepository(ChatMessage)
        private chatRepository: Repository<ChatMessage>,
        @InjectRepository(NoShow)
        private noShowRepository: Repository<NoShow>,
        @InjectRepository(PlayerReport)
        private reportRepository: Repository<PlayerReport>,
        private readonly teamsService: TeamsService,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService,
        private readonly paymentsService: PaymentsService,
        private readonly stadiumsService: StadiumsService,
        private readonly bookingsService: BookingsService,
        private readonly achievementsService: AchievementsService,
        private readonly ratingsService: RatingsService,
    ) {}

    async findAll(page = 1, limit = 12, status?: string, format?: string, district?: string, metro?: string) {
        const where: any = {};
        if (status) where.status = status;
        if (format) where.format = format;
        if (district) where.district = district;
        if (metro) where.metro = metro;

        const isPastFilter = status === 'finished' || status === 'cancelled';
        if (!isPastFilter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.date = MoreThanOrEqual(today);
        }

        const [data, total] = await this.gamesRepository.findAndCount({
            where,
            order: { date: 'ASC', time: 'ASC' },
            relations: ['stats'],
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async findNearby(lat: number, lng: number, radiusKm: number = 5): Promise<Game[]> {
        return this.gamesRepository.query(`
            SELECT g.*,
            (6371 * acos(
                cos(radians($1)) * cos(radians(g.latitude)) *
                cos(radians(g.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(g.latitude))
            )) AS distance
            FROM games g
            WHERE g.status = 'open'
            AND g.latitude IS NOT NULL
            AND (6371 * acos(
                cos(radians($1)) * cos(radians(g.latitude)) *
                cos(radians(g.longitude) - radians($2)) +
                sin(radians($1)) * sin(radians(g.latitude))
            )) < $3
            ORDER BY distance ASC
            LIMIT 20
        `, [lat, lng, radiusKm]);
    }

    async findByTeam(teamId: string): Promise<Game[]> {
        return this.gamesRepository.find({
            where: [{ teamAId: teamId }, { teamBId: teamId }],
            order: { date: 'DESC' },
            relations: ['stats'],
        });
    }

    async setUrgent(gameId: string, isUrgent: boolean): Promise<Game> {
        const game = await this.findOne(gameId);
        game.isUrgent = isUrgent;
        if (isUrgent) {
            this.sendUrgentNotifications(game).catch(e =>
                console.error(`Urgent notification error for game ${gameId}:`, e.message),
            );
        }
        return this.gamesRepository.save(game);
    }

    private compatibleSkillLevels(gameSkill: string): string[] {
        const map: Record<string, string[]> = {
            beginner: ['beginner', 'any'],
            intermediate: ['intermediate', 'any'],
            advanced: ['advanced', 'any'],
            any: [],
        };
        return map[gameSkill] ?? [];
    }

    private async sendUrgentNotifications(game: Game): Promise<void> {
        await this.notifyMatchingPlayers(game, {
            type: 'URGENT_PLAYER_NEEDED',
            title: '🚨 Tezili! Oyunçu lazımdır!',
            buildMessage: (spotsLeft) => `${game.title} · ${game.format} · ${spotsLeft} yer · ${game.location}`,
        });
    }

    private async notifyMatchingPlayers(game: Game, notification: { type: string; title: string; buildMessage: (spotsLeft: number) => string }, skipDistrict = false): Promise<void> {
        const joinedIds = (game.players || []).map((p: any) => p.id);
        const alreadyNotified = game.hotNotifiedPlayerIds || [];
        const excludeIds = [...new Set([...joinedIds, ...alreadyNotified, game.organizerId].filter(Boolean))];
        const spotsLeft = game.maxPlayers - joinedIds.length;
        const gameSkill = (game as any).skillLevel || 'any';
        const skillQueries: Array<string | null> = gameSkill === 'any' ? [null] : [gameSkill, 'any'];

        const notifiedIds: string[] = [];
        const seen = new Set(excludeIds);

        for (const skill of skillQueries) {
            const body: Record<string, any> = { excludeIds: [...seen], limit: 50 };
            if (!skipDistrict && game.district) body.district = game.district;
            if (skill !== null) body.skillLevel = skill;

            let candidates: any[] = [];
            try {
                const result = await this.usersService.smartSearch(body);
                candidates = (result as any)?.users || result || [];
            } catch (e) {
                console.error(`smart-search failed (skill=${skill}):`, e.message);
                continue;
            }

            for (const player of candidates) {
                if (seen.has(player.id)) continue;
                seen.add(player.id);
                notifiedIds.push(player.id);
                try {
                    await this.notificationsService.sendNotification(
                        player.id,
                        notification.type,
                        notification.title,
                        notification.buildMessage(spotsLeft),
                    );
                } catch (e) {
                    console.error(`Failed to notify player ${player.id}:`, e.message);
                }
            }
        }

        game.hotNotifiedPlayerIds = [...alreadyNotified, ...notifiedIds];
        await this.gamesRepository.save(game);
        console.log(`[${notification.type}] game ${game.id} (skill: ${gameSkill}): notified ${notifiedIds.length} players`);
    }

    async findOne(id: string): Promise<Game> {
        const game = await this.gamesRepository.findOne({ where: { id }, relations: ['stats'] });
        if (!game) throw new NotFoundException(`Game with ID ${id} not found`);
        return game;
    }

    async create(gameData: Partial<Game>): Promise<Game> {
        if (!gameData.title || (gameData.title as string).trim().length < 5)
            throw new BadRequestException('Title must be at least 5 characters');
        if (!gameData.maxPlayers || gameData.maxPlayers < 2)
            throw new BadRequestException('maxPlayers must be at least 2');
        if (!gameData.format) throw new BadRequestException('format is required');
        if (!gameData.date || !gameData.time) throw new BadRequestException('date and time are required');
        if (!gameData.stadiumId) throw new BadRequestException('stadiumId is required');

        if (!gameData.minPlayers && gameData.maxPlayers) {
            gameData.minPlayers = Math.floor(gameData.maxPlayers / 2);
        }

        if (gameData.stadiumId) {
            try {
                const stadium = await this.stadiumsService.findOne(gameData.stadiumId);
                if (stadium) {
                    gameData.latitude = stadium.latitude;
                    gameData.longitude = stadium.longitude;
                }
            } catch (e) {
                console.error('Failed to fetch stadium coordinates', e.message);
            }
        }

        const game = this.gamesRepository.create(gameData);
        const savedGame = await this.gamesRepository.save(game);

        if (gameData.stadiumId && gameData.date && gameData.time) {
            try {
                const dateStr = typeof gameData.date === 'string'
                    ? gameData.date
                    : (gameData.date as Date).toISOString().split('T')[0];

                const durationMinutes = (gameData as any).duration || 60;
                const [startHour, startMin] = gameData.time.split(':').map(Number);
                const totalMinutes = startHour * 60 + startMin + durationMinutes;
                const endHour = Math.floor(totalMinutes / 60) % 24;
                const endMinute = totalMinutes % 60;
                const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

                const booking = await this.bookingsService.create({
                    stadiumId: gameData.stadiumId,
                    date: dateStr,
                    startTime: gameData.time,
                    endTime,
                    userId: gameData.organizerId,
                    customerName: 'Игра #' + savedGame.id.slice(0, 8),
                    gameId: savedGame.id,
                    gameName: (gameData as any).title || 'Футбольная игра',
                    currentPlayers: 0,
                    maxPlayers: gameData.maxPlayers || 14,
                    minPlayers: gameData.minPlayers || 7,
                    gameFormat: gameData.format || '7x7',
                    price: (gameData as any).price || 0,
                });

                savedGame.bookingId = booking.id;
                savedGame.bookingStatus = 'pending';
                await this.gamesRepository.save(savedGame);
            } catch (error) {
                console.error('Failed to create booking:', error.message);
            }
        }

        // Notify matching players about the new game (fire-and-forget)
        // skipDistrict=true: notify all matching skill players city-wide, not just same district
        this.notifyMatchingPlayers(savedGame, {
            type: 'NEW_GAME',
            title: 'Yeni oyun yaradıldı! ⚽',
            buildMessage: () => {
                const dateStr = typeof savedGame.date === 'string'
                    ? savedGame.date
                    : new Date(savedGame.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                return `${savedGame.title} · ${savedGame.format} · ${dateStr} ${savedGame.time} · ${savedGame.location}`;
            },
        }, true).catch(e => console.error('Failed to send new-game notifications:', e.message));

        return savedGame;
    }

    async update(id: string, gameData: Partial<Game>): Promise<Game> {
        await this.gamesRepository.update(id, gameData);
        return this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.gamesRepository.delete(id);
    }

    async cancelGame(gameId: string, organizerId: string, reason?: string): Promise<Game> {
        const game = await this.findOne(gameId);
        if (!game) throw new NotFoundException('Game not found');
        if (game.organizerId !== organizerId) throw new BadRequestException('Only organizer can cancel');
        if (game.status === 'cancelled') throw new BadRequestException('Game already cancelled');
        if (game.status === 'finished') throw new BadRequestException('Cannot cancel finished game');

        game.status = 'cancelled';

        // Cancel booking if exists
        if (game.bookingId) {
            try { await this.bookingsService.updateStatus(game.bookingId, 'cancelled'); } catch {}
        }
        game.bookingStatus = 'cancelled';

        const saved = await this.gamesRepository.save(game);

        // Refund all participants and notify
        for (const player of game.players) {
            if (player.id === organizerId) continue;
            try {
                await this.paymentsService.refundToWallet(player.id, 0.50);
                await this.notificationsService.sendNotification(
                    player.id, 'GAME_CANCELLED',
                    'Oyun ləğv edildi',
                    `${game.title} ləğv edildi${reason ? ': ' + reason : ''}. 0.50 ₼ qaytarıldı.`,
                    undefined,
                    { gameId: game.id },
                );
            } catch (e) {
                console.error(`Failed to refund/notify player ${player.id}:`, e.message);
            }
        }

        return saved;
    }

    async joinGame(gameId: string, player: any, referredBy?: string): Promise<Game> {
        const game = await this.findOne(gameId);

        const existingPlayerIndex = game.players.findIndex(p => p.id === player.id);
        if (existingPlayerIndex !== -1) {
            if (game.players[existingPlayerIndex].position !== player.position) {
                game.players[existingPlayerIndex].position = player.position;
                return this.gamesRepository.save(game);
            }
            return game;
        }

        if (game.gameType === 'private') {
            const invitedPlayers = game.invitedPlayers || [];
            const pendingInvites = game.pendingInvites as Record<string, any> || {};
            const isOrganizer = game.organizerId === player.id;
            const isInvited = invitedPlayers.includes(player.id);
            const hasAcceptedInvite = pendingInvites[player.id]?.status === 'accepted';
            if (!isOrganizer && (!isInvited || !hasAcceptedInvite)) {
                throw new Error('Это приватная игра. Вы должны принять приглашение.');
            }
        }

        // Берём только комиссию платформы — остальное игроки платят на месте
        const amount = 0.50;

        try {
            await this.paymentsService.processPayment(player.id, amount, gameId);
        } catch (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('Insufficient funds')) {
                throw new BadRequestException('Недостаточно средств. Пополните кошелек.');
            }
            throw new Error(`Ошибка оплаты: ${errorMessage}`);
        }

        try {
            game.players.push(player);

            if (referredBy && referredBy !== player.id) {
                const alreadyReferred = (game.referrals || []).some(r => r.referredUserId === player.id);
                const referrerIsPlayer = game.players.some(p => p.id === referredBy);
                if (!alreadyReferred && referrerIsPlayer) {
                    const referralEntry = { referrerId: referredBy, referredUserId: player.id, bonusPaid: false };
                    game.referrals = [...(game.referrals || []), referralEntry];
                    try {
                        await this.usersService.updateBalance(referredBy, 0.5);
                        const idx = game.referrals.findIndex(r => r.referrerId === referredBy && r.referredUserId === player.id);
                        if (idx !== -1) game.referrals[idx].bonusPaid = true;
                    } catch (refErr) {
                        console.error(`Failed to pay referral bonus to ${referredBy}:`, refErr.message);
                    }
                }
            }

            const pendingInvites = game.pendingInvites as Record<string, any> || {};
            if (pendingInvites[player.id]) {
                pendingInvites[player.id].status = 'accepted';
                pendingInvites[player.id].acceptedAt = new Date().toISOString();
                game.pendingInvites = pendingInvites;
                if (game.organizerId && game.organizerId !== player.id) {
                    try {
                        await this.notificationsService.sendNotification(
                            game.organizerId, 'INVITE_ACCEPTED', undefined, undefined,
                            undefined, { gameId: game.id, playerName: player.name || 'Игрок', playerCount: game.players.length, maxPlayers: game.maxPlayers },
                        );
                    } catch (e) {
                        console.error('Failed to notify organizer:', e.message);
                    }
                }
            }

            if (game.bookingId) {
                try {
                    await this.bookingsService.updatePlayerCount(game.bookingId, game.players.length);
                } catch (e) {
                    console.error('Failed to update booking player count:', e.message);
                }
            }

            if (game.bookingId && game.bookingStatus === 'pending' && game.players.length >= game.minPlayers) {
                await this.confirmBooking(game);
            }

            if (game.players.length === game.maxPlayers && !game.gameSaverId) {
                game.gameSaverId = player.id;
                game.status = 'full';
            }

            try {
                await this.notificationsService.sendNotification(
                    player.id, 'PAYMENT_SUCCESS', undefined, undefined,
                    undefined, { gameId: game.id, amount },
                );
            } catch (e) {
                console.error('Failed to send notification', e);
            }

            return await this.gamesRepository.save(game);
        } catch (error) {
            console.error('Join game failed AFTER payment. Initiating Refund.', error.message);
            try {
                await this.paymentsService.refundToWallet(player.id, amount);
            } catch (refundError) {
                console.error('CRITICAL: Refund failed after join error!', refundError.message);
            }
            throw new Error(`Ошибка записи: ${error.message}. Средства возвращены.`);
        }
    }

    private async confirmBooking(game: Game): Promise<void> {
        try {
            await this.bookingsService.updateStatus(game.bookingId, 'confirmed');
            game.bookingStatus = 'confirmed';
            await this.gamesRepository.save(game);

            if (game.stadiumId) {
                const stadium = await this.stadiumsService.findOne(game.stadiumId);
                if (stadium?.ownerId) {
                    await this.notificationsService.sendNotification(
                        stadium.ownerId, 'BOOKING_CONFIRMED', undefined, undefined,
                        undefined, { gameId: game.id, date: new Date(game.date).toISOString(), time: game.time, playerCount: game.players.length },
                    );
                }
            }
        } catch (error) {
            console.error('Failed to confirm booking:', error.message);
        }
    }

    async finishGame(id: string, finishData: any): Promise<Game> {
        const game = await this.findOne(id);
        game.status = 'finished';
        game.scoreTeamA = finishData.scoreTeamA;
        game.scoreTeamB = finishData.scoreTeamB;
        if (finishData.mvpId) game.mvpId = finishData.mvpId;
        const savedGame = await this.gamesRepository.save(game);

        if (game.teamAId && game.teamBId) {
            try {
                const isDraw = Number(game.scoreTeamA) === Number(game.scoreTeamB);
                const winnerId = Number(game.scoreTeamA) > Number(game.scoreTeamB) ? game.teamAId : game.teamBId;
                const loserId = winnerId === game.teamAId ? game.teamBId : game.teamAId;
                await this.teamsService.updateStatsAfterMatch(winnerId, loserId, isDraw);
            } catch (error) {
                console.error('Failed to update team statistics:', error);
            }
        }

        if (finishData.playerStats?.length > 0) {
            for (const stat of finishData.playerStats) {
                const playerStats = this.statsRepository.create({ gameId: id, playerId: stat.playerId, goals: stat.goals, assists: stat.assists });
                await this.statsRepository.save(playerStats);
                try {
                    await this.usersService.updateStats(stat.playerId, { goals: stat.goals, assists: stat.assists, isMvp: finishData.mvpId === stat.playerId });
                    if (stat.goals >= 3) {
                        await this.achievementsService.create({ userId: stat.playerId, type: 'HAT_TRICK', title: 'Хет-трик', description: 'Забил 3 гола в одном матче', gameId: id });
                    }
                    if (stat.assists >= 3) {
                        await this.achievementsService.create({ userId: stat.playerId, type: 'PLAYMAKER', title: 'Плеймейкер', description: 'Отдал 3 голевые передачи', gameId: id });
                    }
                } catch (error) {
                    console.error(`Failed to sync stats for ${stat.playerId}:`, error.message);
                }
            }
        }

        // Notify all players to rate teammates and vote for MVP
        const scoreText = `${savedGame.scoreTeamA ?? '?'}:${savedGame.scoreTeamB ?? '?'}`;
        for (const player of savedGame.players) {
            try {
                await this.notificationsService.sendNotification(
                    player.id, 'RATE_PLAYERS', undefined, undefined,
                    undefined, { gameId: id, scoreTeamA: savedGame.scoreTeamA, scoreTeamB: savedGame.scoreTeamB },
                );
            } catch (e) {
                console.error(`Failed to notify player ${player.id}:`, e.message);
            }
        }

        return this.findOne(id);
    }

    async leaveGame(gameId: string, playerId: string): Promise<Game> {
        const game = await this.findOne(gameId);
        const playerIndex = game.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) throw new NotFoundException('Player not found in this game');

        const gameDate = new Date(game.date);
        const now = new Date();
        const hoursUntilGame = (gameDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const refundAmount = 0.50;

        if (hoursUntilGame > 24) {
            try {
                await this.paymentsService.refundToWallet(playerId, refundAmount);
                await this.notificationsService.sendNotification(playerId, 'GAME_CANCELED', undefined, undefined, undefined, { gameId });
            } catch (e) {
                console.error('Refund/Notification failed', e);
            }
        } else {
            try {
                await this.notificationsService.sendNotification(playerId, 'PENALTY', undefined, undefined, undefined, { gameId });
            } catch (e) {
                console.error('Notification failed', e);
            }
        }

        game.players.splice(playerIndex, 1);

        if (game.bookingId && game.bookingStatus === 'confirmed' && game.players.length < game.minPlayers) {
            try {
                const stadium = await this.stadiumsService.findOne(game.stadiumId);
                if (stadium?.ownerId) {
                    await this.notificationsService.sendNotification(
                        stadium.ownerId, 'PLAYER_LEFT', undefined, undefined,
                        undefined, { gameId: game.id, playerCount: game.players.length, minPlayers: game.minPlayers },
                    );
                }
            } catch (e) {
                console.error('Failed to notify partner', e);
            }
        }

        return this.gamesRepository.save(game);
    }

    async cancelExpiredPendingBookings(): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() + 24);

        const games = await this.gamesRepository.find({ where: { bookingStatus: 'pending' } });

        for (const game of games) {
            const gameDate = new Date(game.date);
            if (gameDate <= cutoffDate && game.players.length < game.minPlayers) {
                try {
                    if (game.bookingId) await this.bookingsService.updateStatus(game.bookingId, 'cancelled');
                    game.bookingStatus = 'cancelled';
                    game.status = 'cancelled';
                    await this.gamesRepository.save(game);

                    if (game.stadiumId) {
                        const stadium = await this.stadiumsService.findOne(game.stadiumId);
                        if (stadium?.ownerId) {
                            await this.notificationsService.sendNotification(
                                stadium.ownerId, 'BOOKING_CANCELLED', undefined, undefined,
                                undefined, { gameId: game.id, date: new Date(game.date).toISOString() },
                            );
                        }
                    }

                    for (const player of game.players) {
                        await this.notificationsService.sendNotification(
                            player.id, 'GAME_CANCELLED', undefined, undefined,
                            undefined, { gameId: game.id },
                        );
                    }
                } catch (error) {
                    console.error(`Failed to cancel game ${game.id}:`, error.message);
                }
            }
        }
    }

    async smartInvite(gameId: string, filters: any): Promise<{ invitedCount: number; invitedPlayers: string[] }> {
        const game = await this.findOne(gameId);
        const excludeIds = [...game.players.map(p => p.id), ...(game.invitedPlayers || [])];

        const result = await this.usersService.smartSearch({ ...filters, excludeIds, limit: filters.limit || 30 });
        const users = (result as any)?.users || result || [];
        const scores = (result as any)?.scores || {};
        const invitedPlayerIds = users.map((u: any) => u.id);

        const pendingInvites: Record<string, any> = (game.pendingInvites as any) || {};
        for (const user of users) {
            pendingInvites[user.id] = { status: 'pending', score: scores[user.id], sentAt: new Date().toISOString() };
        }
        game.pendingInvites = pendingInvites;
        game.invitedPlayers = [...(game.invitedPlayers || []), ...invitedPlayerIds];
        await this.gamesRepository.save(game);

        for (const user of users) {
            try {
                await this.notificationsService.sendNotification(
                    user.id, 'GAME_INVITE', undefined, undefined,
                    undefined, { gameId: game.id, date: new Date(game.date).toISOString(), time: game.time },
                );
            } catch (e) {
                console.error(`Failed to send invite to ${user.id}:`, e.message);
            }
        }

        return { invitedCount: invitedPlayerIds.length, invitedPlayers: invitedPlayerIds };
    }

    async acceptInvite(gameId: string, playerId: string): Promise<{ success: boolean; message: string; gameId?: string }> {
        const game = await this.findOne(gameId);
        const pendingInvites = game.pendingInvites as Record<string, any> || {};
        let inviteEntry = pendingInvites[playerId];

        if (!inviteEntry && game.invitedPlayers?.includes(playerId)) {
            inviteEntry = { status: 'pending', invitedAt: game.createdAt };
            pendingInvites[playerId] = inviteEntry;
        }

        // Urgent notification — игрок в hotNotifiedPlayerIds
        if (!inviteEntry && (game.hotNotifiedPlayerIds || []).includes(playerId)) {
            inviteEntry = { status: 'pending', inviteType: 'urgent', sentAt: new Date().toISOString() };
            pendingInvites[playerId] = inviteEntry;
        }

        if (!inviteEntry || inviteEntry.status !== 'pending') {
            throw new BadRequestException('Приглашение не найдено или уже использовано');
        }

        if (game.players.length >= game.maxPlayers) {
            pendingInvites[playerId].status = 'slot_taken';
            game.pendingInvites = pendingInvites;
            await this.gamesRepository.save(game);
            throw new BadRequestException('Все места уже заняты');
        }

        // Помечаем приглашение как принятое, но НЕ добавляем в game.players.
        // Игрок сам выберет позицию и команду через joinGame на странице игры.
        pendingInvites[playerId].status = 'accepted';
        pendingInvites[playerId].acceptedAt = new Date().toISOString();
        game.pendingInvites = pendingInvites;
        await this.gamesRepository.save(game);

        return { success: true, message: 'Приглашение принято! Выберите позицию на поле.', gameId };
    }

    async balanceTeams(gameId: string): Promise<{ teamA: any[]; teamB: any[]; avgMmrA: number; avgMmrB: number }> {
        const game = await this.findOne(gameId);
        if (game.players.length < 2) throw new Error('Недостаточно игроков');

        const playerIds = game.players.map(p => p.id);
        let playersWithRatings: Array<{ id: string; name: string; avatar: string; mmr: number }>;

        try {
            const result = await this.usersService.getBatchRatings(playerIds);
            playersWithRatings = result as any;
        } catch (error) {
            playersWithRatings = game.players.map(p => ({ id: p.id, name: p.name || 'Unknown', avatar: p.avatar || '', mmr: 50 }));
        }

        playersWithRatings.sort((a, b) => b.mmr - a.mmr);

        const teamA: any[] = [];
        const teamB: any[] = [];
        playersWithRatings.forEach((player, index) => {
            const round = Math.floor(index / 2);
            const isEvenRound = round % 2 === 0;
            const isFirstInPair = index % 2 === 0;
            if ((isEvenRound && isFirstInPair) || (!isEvenRound && !isFirstInPair)) {
                teamA.push(player);
            } else {
                teamB.push(player);
            }
        });

        const avgMmrA = teamA.length > 0 ? Math.round(teamA.reduce((s, p) => s + p.mmr, 0) / teamA.length) : 0;
        const avgMmrB = teamB.length > 0 ? Math.round(teamB.reduce((s, p) => s + p.mmr, 0) / teamB.length) : 0;

        game.teamA = teamA;
        game.teamB = teamB;
        game.teamsBalanced = true;
        await this.gamesRepository.save(game);

        return { teamA, teamB, avgMmrA, avgMmrB };
    }

    calculateSlotPrice(advanceAmount: number, maxPlayers: number, commissionPerPlayer: number): number {
        if (advanceAmount <= 0 || maxPlayers <= 0) return commissionPerPlayer;
        const playersForAdvance = Math.min(maxPlayers, 10);
        const advancePerPlayer = advanceAmount / playersForAdvance;
        return Math.round((advancePerPlayer + commissionPerPlayer) * 100) / 100;
    }

    async sendPrivateInvites(gameId: string, playerIds: string[]): Promise<{ sentCount: number }> {
        const game = await this.findOne(gameId);
        game.invitedPlayers = [...(game.invitedPlayers || []), ...playerIds];
        const pendingInvites = game.pendingInvites as Record<string, any> || {};
        for (const playerId of playerIds) {
            if (!pendingInvites[playerId]) {
                pendingInvites[playerId] = { status: 'pending', invitedAt: new Date().toISOString() };
            }
        }
        game.pendingInvites = pendingInvites;
        await this.gamesRepository.save(game);

        let sentCount = 0;
        for (const playerId of playerIds) {
            try {
                await this.notificationsService.sendNotification(
                    playerId, 'GAME_INVITE', undefined, undefined,
                    undefined, { gameId: game.id, date: new Date(game.date).toISOString(), time: game.time },
                );
                sentCount++;
            } catch (e) {
                console.error(`Failed to invite ${playerId}:`, e.message);
            }
        }

        return { sentCount };
    }

    async saveChatMessage(gameId: string, userId: string, userName: string, message: string, userAvatar?: string): Promise<ChatMessage> {
        const chatMessage = this.chatRepository.create({ gameId, userId, userName, userAvatar, message });
        return this.chatRepository.save(chatMessage);
    }

    async getChatMessages(gameId: string): Promise<ChatMessage[]> {
        return this.chatRepository.find({ where: { gameId }, order: { createdAt: 'ASC' } });
    }

    async getGameInvites(gameId: string) {
        const game = await this.findOne(gameId);
        const pendingInvites = (game.pendingInvites || {}) as Record<string, any>;
        const hotIds: string[] = game.hotNotifiedPlayerIds || [];

        // Объединяем: smart invite + urgent hot notifications
        const allIds = new Set([...Object.keys(pendingInvites), ...hotIds]);
        if (allIds.size === 0) return [];

        try {
            const users = await this.usersService.getBatchUsers([...allIds]);
            return (users as any[]).map((user: any) => {
                const invite = pendingInvites[user.id];
                const isHot = hotIds.includes(user.id);
                return {
                    ...user,
                    status: invite?.status || 'pending',
                    sentAt: invite?.sentAt,
                    score: invite?.score,
                    inviteType: invite ? 'smart' : isHot ? 'urgent' : 'manual',
                };
            });
        } catch (e) {
            console.error('Failed to fetch invited users:', e.message);
            return [];
        }
    }

    async getUserInvitations(userId: string) {
        const games = await this.gamesRepository
            .createQueryBuilder('game')
            .where('game."pendingInvites"::text LIKE :userId', { userId: `%"${userId}"%` })
            .orWhere('game."invitedPlayers"::text LIKE :userId2', { userId2: `%${userId}%` })
            .orWhere('game."hotNotifiedPlayerIds"::text LIKE :userId3', { userId3: `%${userId}%` })
            .andWhere('game.status IN (:...statuses)', { statuses: ['open', 'full'] })
            .orderBy('game.date', 'ASC')
            .getMany();

        const invitations = [];
        for (const game of games) {
            const pendingInvites = (game.pendingInvites || {}) as Record<string, any>;
            const inviteData = pendingInvites[userId];
            const isHotInvited = (game.hotNotifiedPlayerIds || []).includes(userId);
            const isInvited = inviteData || (game.invitedPlayers || []).includes(userId) || isHotInvited;

            if (!isInvited) continue;

            let organizerName = 'Unknown';
            if (game.organizerId) {
                try {
                    const user = await this.usersService.findOneById(game.organizerId);
                    organizerName = user?.name || 'Unknown';
                } catch (e) {}
            }

            invitations.push({
                gameId: game.id,
                gameName: game.title || game.location || 'Игра',
                date: game.date,
                time: game.time,
                location: game.location,
                format: game.format,
                organizerName,
                inviteStatus: inviteData?.status || 'pending',
                inviteType: inviteData ? 'smart' : isHotInvited ? 'urgent' : 'manual',
                sentAt: inviteData?.sentAt || new Date().toISOString(),
                playersCount: game.players?.length || 0,
                maxPlayers: game.maxPlayers,
            });
        }
        return invitations;
    }

    async startFinishGame(id: string, scoreData: { scoreTeamA: number; scoreTeamB: number }): Promise<Game> {
        const game = await this.findOne(id);
        if (game.gamePhase !== 'active') throw new BadRequestException('Игра уже находится в процессе завершения');

        game.gamePhase = 'pending_stats';
        game.scoreTeamA = scoreData.scoreTeamA;
        game.scoreTeamB = scoreData.scoreTeamB;
        game.pendingPlayerStats = {};
        const savedGame = await this.gamesRepository.save(game);

        for (const player of game.players) {
            try {
                await this.notificationsService.sendNotification(
                    player.id, 'CLAIM_STATS', undefined, undefined,
                    undefined, { gameId: game.id, scoreTeamA: scoreData.scoreTeamA, scoreTeamB: scoreData.scoreTeamB },
                );
            } catch (e) {
                console.error(`Failed to notify player ${player.id}:`, e.message);
            }
        }

        return savedGame;
    }

    async claimStats(gameId: string, playerId: string, stats: { goals: number; assists: number }): Promise<Game> {
        const game = await this.findOne(gameId);
        if (game.gamePhase !== 'pending_stats') throw new BadRequestException('Сейчас нельзя заявить статистику');

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new BadRequestException('Вы не участвовали в этой игре');

        const isTeamA = game.teamA?.some(p => p.id === playerId) || game.players.findIndex(p => p.id === playerId) < game.maxPlayers / 2;
        const pendingStats = (game.pendingPlayerStats || {}) as Record<string, any>;
        pendingStats[playerId] = { goals: stats.goals, assists: stats.assists, playerName: player.name, team: isTeamA ? 'A' : 'B', claimedAt: new Date().toISOString() };
        game.pendingPlayerStats = pendingStats;
        const savedGame = await this.gamesRepository.save(game);

        if (game.organizerId) {
            try {
                await this.notificationsService.sendNotification(
                    game.organizerId, 'STATS_CLAIMED', undefined, undefined,
                    undefined, { gameId, playerName: player.name, goals: stats.goals, assists: stats.assists },
                );
            } catch (e) {}
        }

        return savedGame;
    }

    async validateStats(gameId: string, organizerId: string, validatedStats: Array<{ playerId: string; goals: number; assists: number }>): Promise<Game> {
        const game = await this.findOne(gameId);
        if (game.gamePhase !== 'pending_stats') throw new BadRequestException('Игра не в режиме проверки статистики');
        if (game.organizerId !== organizerId) throw new BadRequestException('Только организатор может подтвердить статистику');

        const pendingStats = game.pendingPlayerStats as Record<string, any> || {};

        const teamAGoals = validatedStats.filter(s => (pendingStats[s.playerId]?.team === 'A') || game.players.findIndex(p => p.id === s.playerId) < game.maxPlayers / 2).reduce((sum, s) => sum + s.goals, 0);
        const teamBGoals = validatedStats.filter(s => (pendingStats[s.playerId]?.team === 'B') || game.players.findIndex(p => p.id === s.playerId) >= game.maxPlayers / 2).reduce((sum, s) => sum + s.goals, 0);

        if (teamAGoals !== Number(game.scoreTeamA)) throw new BadRequestException(`Сумма голов команды А (${teamAGoals}) не совпадает со счетом (${game.scoreTeamA})`);
        if (teamBGoals !== Number(game.scoreTeamB)) throw new BadRequestException(`Сумма голов команды Б (${teamBGoals}) не совпадает со счетом (${game.scoreTeamB})`);

        const votesTeamA: Record<string, number> = {};
        const votesTeamB: Record<string, number> = {};
        for (const [playerId, stats] of Object.entries(pendingStats)) {
            if (stats.mvpVoteId) {
                if (stats.team === 'A') votesTeamA[stats.mvpVoteId] = (votesTeamA[stats.mvpVoteId] || 0) + 1;
                else votesTeamB[stats.mvpVoteId] = (votesTeamB[stats.mvpVoteId] || 0) + 1;
            }
        }

        const getMvpWinner = (votes: Record<string, number>) => Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
        game.mvpTeamAId = getMvpWinner(votesTeamA);
        game.mvpTeamBId = getMvpWinner(votesTeamB);

        for (const [playerId, stats] of Object.entries(pendingStats)) {
            try {
                const receivedBadges: Record<string, number> = {};
                for (const [voterId, voterStats] of Object.entries(pendingStats)) {
                    if (voterId === playerId) continue;
                    for (const badge of ((voterStats as any).badges || [])) {
                        if (badge.playerId === playerId) receivedBadges[badge.badgeType] = (receivedBadges[badge.badgeType] || 0) + 1;
                    }
                }
                const playerGoals = (stats as any).goals || 0;
                const playerAssists = (stats as any).assists || 0;
                const teamScore = (stats as any).team === 'A' ? Number(game.scoreTeamA) : Number(game.scoreTeamB);
                if (teamScore > 0 && playerGoals >= teamScore * 0.5) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 2;
                if (playerAssists >= 3) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 1;
                if (playerGoals > 2) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 1;
                if (Object.keys(receivedBadges).length > 0) await this.usersService.applyBadges(playerId, receivedBadges);
            } catch (error) {
                console.error(`Failed to apply badges for ${playerId}:`, error.message);
            }
        }

        if (game.gameSaverId) {
            try {
                await this.usersService.applyBadges(game.gameSaverId, { game_saver: 1 });
            } catch (e) {}
        }

        game.gamePhase = 'completed';
        game.status = 'finished';
        game.statsValidated = true;
        const savedGame = await this.gamesRepository.save(game);

        for (const stat of validatedStats) {
            try {
                await this.statsRepository.createQueryBuilder().insert().into('game_player_stats').values({ gameId: savedGame.id, playerId: stat.playerId, goals: stat.goals, assists: stat.assists }).execute();
                await this.usersService.updateStats(stat.playerId, { goals: stat.goals, assists: stat.assists, isMvp: stat.playerId === game.mvpTeamAId || stat.playerId === game.mvpTeamBId });
            } catch (error) {
                console.error(`Failed to save/sync stats for ${stat.playerId}:`, error.message);
            }
        }

        if (game.mvpTeamAId) {
            try { await this.usersService.incrementMvpCount(game.mvpTeamAId); } catch (e) {}
        }
        if (game.mvpTeamBId) {
            try { await this.usersService.incrementMvpCount(game.mvpTeamBId); } catch (e) {}
        }

        const mvpAName = game.players.find(p => p.id === game.mvpTeamAId)?.name || 'N/A';
        const mvpBName = game.players.find(p => p.id === game.mvpTeamBId)?.name || 'N/A';
        for (const player of game.players) {
            try {
                await this.notificationsService.sendNotification(player.id, 'RATE_PLAYERS', undefined, undefined, undefined, { gameId: savedGame.id, mvpAName, mvpBName });
            } catch (e) {}
        }

        return savedGame;
    }

    async getPendingStats(gameId: string) {
        const game = await this.findOne(gameId);
        const pendingStats = (game.pendingPlayerStats || {}) as Record<string, any>;
        let teamAGoals = 0, teamBGoals = 0;
        for (const [, stat] of Object.entries(pendingStats)) {
            if (stat.team === 'A') teamAGoals += stat.goals || 0;
            else teamBGoals += stat.goals || 0;
        }
        return { pendingStats, scoreTeamA: Number(game.scoreTeamA), scoreTeamB: Number(game.scoreTeamB), validation: { teamAGoals, teamBGoals, isValid: teamAGoals === Number(game.scoreTeamA) && teamBGoals === Number(game.scoreTeamB) } };
    }

    async castMvpVote(gameId: string, voterId: string, votedPlayerId: string): Promise<{ success: boolean; message: string }> {
        const game = await this.findOne(gameId);
        if (game.gamePhase !== 'voting') throw new BadRequestException('Голосование еще не открыто');

        const voter = game.players.find(p => p.id === voterId);
        if (!voter) throw new BadRequestException('Вы не участвовали в этой игре');
        if (voterId === votedPlayerId) throw new BadRequestException('Нельзя голосовать за себя');

        const voterIndex = game.players.findIndex(p => p.id === voterId);
        const votedIndex = game.players.findIndex(p => p.id === votedPlayerId);
        const voterTeam = voterIndex < game.maxPlayers / 2 ? 'A' : 'B';
        const votedTeam = votedIndex < game.maxPlayers / 2 ? 'A' : 'B';
        if (voterTeam !== votedTeam) throw new BadRequestException('Можно голосовать только за игрока своей команды');

        try {
            await this.ratingsService.castMvpVote(gameId, voterId, votedPlayerId, voterTeam);
        } catch (error) {
            throw new BadRequestException(error.message);
        }

        return { success: true, message: 'Ваш голос принят!' };
    }

    async completeGame(gameId: string): Promise<Game> {
        const game = await this.findOne(gameId);
        if (game.gamePhase !== 'voting') throw new BadRequestException('Игра не в режиме голосования');

        try {
            const mvpResults = await this.ratingsService.getMvpResults(gameId);
            game.mvpTeamAId = (mvpResults as any).mvpTeamAId;
            game.mvpTeamBId = (mvpResults as any).mvpTeamBId;
            if (game.mvpTeamAId) await this.usersService.incrementMvpCount(game.mvpTeamAId);
            if (game.mvpTeamBId) await this.usersService.incrementMvpCount(game.mvpTeamBId);
        } catch (error) {
            console.error('Failed to get MVP results:', error.message);
        }

        game.gamePhase = 'completed';
        game.status = 'finished';

        if (game.teamAId && game.teamBId) {
            try {
                const isDraw = Number(game.scoreTeamA) === Number(game.scoreTeamB);
                const winnerId = Number(game.scoreTeamA) > Number(game.scoreTeamB) ? game.teamAId : game.teamBId;
                const loserId = winnerId === game.teamAId ? game.teamBId : game.teamAId;
                await this.teamsService.updateStatsAfterMatch(winnerId, loserId, isDraw);
            } catch (error) {
                console.error('Failed to update team statistics:', error);
            }
        }

        const savedGame = await this.gamesRepository.save(game);

        for (const player of game.players) {
            try {
                await this.notificationsService.sendNotification(player.id, 'RATE_PLAYERS', undefined, undefined, undefined, { gameId: savedGame.id });
            } catch (e) {}
        }

        for (const player of game.players) {
            try {
                await this.usersService.payReferrerBonus(player.id);
            } catch (e) {}
        }

        return savedGame;
    }

    async submitPostGame(gameId: string, playerId: string, data: { goals: number; assists: number; mvpVoteId?: string; badges?: Array<{ playerId: string; badgeType: string }> }): Promise<{ success: boolean; message: string }> {
        const game = await this.findOne(gameId);
        if (game.gamePhase !== 'pending_stats') throw new BadRequestException('Игра не в режиме сбора статистики');

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new BadRequestException('Вы не участвовали в этой игре');

        const pendingStats = game.pendingPlayerStats as Record<string, any> || {};
        if (pendingStats[playerId]) throw new BadRequestException('Вы уже отправили статистику');

        const playerIndex = game.players.findIndex(p => p.id === playerId);
        const playerTeam = playerIndex < game.maxPlayers / 2 ? 'A' : 'B';

        pendingStats[playerId] = { goals: data.goals, assists: data.assists, mvpVoteId: data.mvpVoteId, badges: data.badges || [], playerName: player.name, team: playerTeam, submittedAt: new Date().toISOString() };
        game.pendingPlayerStats = pendingStats;

        if (Object.keys(pendingStats).length >= game.players.length) {
            await this.autoCompleteGame(game);
            await this.gamesRepository.save(game);
            return { success: true, message: 'Все игроки отправили статистику! Игра завершена.' };
        }

        await this.gamesRepository.save(game);
        return { success: true, message: `Статистика сохранена! (${Object.keys(pendingStats).length}/${game.players.length})` };
    }

    private async autoCompleteGame(game: Game): Promise<void> {
        const pendingStats = game.pendingPlayerStats as Record<string, any>;

        const votesTeamA: Record<string, number> = {};
        const votesTeamB: Record<string, number> = {};
        for (const [playerId, stats] of Object.entries(pendingStats)) {
            if (stats.mvpVoteId) {
                if (stats.team === 'A') votesTeamA[stats.mvpVoteId] = (votesTeamA[stats.mvpVoteId] || 0) + 1;
                else votesTeamB[stats.mvpVoteId] = (votesTeamB[stats.mvpVoteId] || 0) + 1;
            }
        }

        const getMvp = (votes: Record<string, number>) => Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        game.mvpTeamAId = getMvp(votesTeamA) || undefined;
        game.mvpTeamBId = getMvp(votesTeamB) || undefined;

        for (const [playerId, stats] of Object.entries(pendingStats)) {
            try {
                await this.statsRepository.createQueryBuilder().insert().into('game_player_stats').values({ gameId: game.id, playerId, goals: stats.goals, assists: stats.assists }).execute();
                await this.usersService.updateStats(playerId, { goals: stats.goals, assists: stats.assists, isMvp: playerId === game.mvpTeamAId || playerId === game.mvpTeamBId });
            } catch (error) {
                console.error(`Failed to save stats for ${playerId}:`, error.message);
            }
        }

        if (game.mvpTeamAId) { try { await this.usersService.incrementMvpCount(game.mvpTeamAId); } catch (e) {} }
        if (game.mvpTeamBId) { try { await this.usersService.incrementMvpCount(game.mvpTeamBId); } catch (e) {} }

        game.gamePhase = 'completed';
        game.status = 'finished';
        game.statsValidated = true;

        for (const [playerId, stats] of Object.entries(pendingStats)) {
            try {
                const receivedBadges: Record<string, number> = {};
                for (const [voterId, voterStats] of Object.entries(pendingStats)) {
                    if (voterId === playerId) continue;
                    for (const badge of ((voterStats as any).badges || [])) {
                        if (badge.playerId === playerId) receivedBadges[badge.badgeType] = (receivedBadges[badge.badgeType] || 0) + 1;
                    }
                }
                const playerGoals = (stats as any).goals || 0;
                const playerAssists = (stats as any).assists || 0;
                const teamScore = (stats as any).team === 'A' ? Number(game.scoreTeamA) : Number(game.scoreTeamB);
                if (teamScore > 0 && playerGoals >= teamScore * 0.5) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 2;
                if (playerAssists >= 3) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 1;
                if (playerGoals > 2) receivedBadges['attack'] = (receivedBadges['attack'] || 0) + 1;
                if (Object.keys(receivedBadges).length > 0) await this.usersService.applyBadges(playerId, receivedBadges);
            } catch (error) {
                console.error(`Failed to apply badges for ${playerId}:`, error.message);
            }
        }

        console.log(`Game ${game.id} auto-completed. MVPs: A=${game.mvpTeamAId}, B=${game.mvpTeamBId}`);
    }

    async reportNoShows(gameId: string, reportedByUserId: string, players: { id: string; name?: string }[]): Promise<NoShow[]> {
        const game = await this.gamesRepository.findOne({ where: { id: gameId } });
        if (!game) throw new NotFoundException('Game not found');
        if (game.organizerId !== reportedByUserId) throw new BadRequestException('Only organizer can report no-shows');

        const saved: NoShow[] = [];
        for (const player of players) {
            const existing = await this.noShowRepository.findOne({ where: { gameId, userId: player.id } });
            if (existing) continue;

            const noShow = this.noShowRepository.create({
                gameId, userId: player.id, userName: player.name,
                reportedByUserId,
                gameDate: game.date instanceof Date ? game.date.toISOString().split('T')[0] : String(game.date),
            });
            saved.push(await this.noShowRepository.save(noShow));

            try {
                await this.usersService.incrementNoShowCount(player.id);
            } catch (err) {
                console.error(`Failed to increment noShow for ${player.id}:`, err.message);
            }
        }
        return saved;
    }

    async getNoShows(userId?: string): Promise<NoShow[]> {
        if (userId) return this.noShowRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
        return this.noShowRepository.find({ order: { createdAt: 'DESC' } });
    }

    async submitReport(data: any): Promise<PlayerReport> {
        const report = this.reportRepository.create({ ...data, status: 'pending' });
        return this.reportRepository.save(report) as unknown as Promise<PlayerReport>;
    }

    async getReports(status?: ReportStatus): Promise<PlayerReport[]> {
        const where = status ? { status } : {};
        return this.reportRepository.find({ where, order: { createdAt: 'DESC' } });
    }

    async updateReport(reportId: string, data: { status: ReportStatus; adminNote?: string }): Promise<PlayerReport> {
        const report = await this.reportRepository.findOne({ where: { id: reportId } });
        if (!report) throw new NotFoundException('Report not found');
        report.status = data.status;
        if (data.adminNote) report.adminNote = data.adminNote;
        return this.reportRepository.save(report);
    }

    private localDateStr(d: Date | string): string {
        const date = d instanceof Date ? d : new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    async getHotGames(): Promise<Game[]> {
        const now = new Date();
        const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        const openGames = await this.gamesRepository.find({ where: { status: 'open' }, order: { date: 'ASC' } });
        return openGames.filter(game => {
            const gameDateTime = new Date(`${this.localDateStr(game.date)}T${game.time}:00`);
            if (gameDateTime < now || gameDateTime > fourHoursLater) return false;
            const spotsLeft = game.maxPlayers - (game.players || []).length;
            return spotsLeft >= 1 && spotsLeft <= 3;
        });
    }

    async sendHotGameNotifications(): Promise<void> {
        const now = new Date();
        const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const openGames = await this.gamesRepository.find({ where: { status: 'open' }, order: { date: 'ASC' } });
        const hotGames = openGames.filter(game => {
            const gameDateTime = new Date(`${this.localDateStr(game.date)}T${game.time}:00`);
            if (gameDateTime < now || gameDateTime > threeHoursLater) return false;
            const spotsLeft = game.maxPlayers - (game.players || []).length;
            return spotsLeft >= 1 && spotsLeft <= 3;
        });

        for (const game of hotGames) {
            try {
                const spotsLeft = game.maxPlayers - (game.players || []).length;
                const gameDateTime = new Date(`${this.localDateStr(game.date)}T${game.time}:00`);
                const minsLeft = Math.round((gameDateTime.getTime() - now.getTime()) / 60000);
                const hoursLeft = Math.floor(minsLeft / 60);
                const minsRem = minsLeft % 60;
                const timeStr = hoursLeft > 0 ? `${hoursLeft}s ${minsRem}d` : `${minsLeft} dəq`;
                await this.notifyMatchingPlayers(game, {
                    type: 'HOT_GAME',
                    title: '🔥 Yaxınlıqda isti oyun!',
                    buildMessage: () => `${game.title} · ${game.format} · ${spotsLeft} yer · ${timeStr} sonra`,
                });
            } catch (e) {
                console.error(`Failed hot notifications for game ${game.id}:`, e.message);
            }
        }
    }
}
