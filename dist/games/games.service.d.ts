import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { GamePlayerStats } from './entities/game-player-stats.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { NoShow } from './entities/no-show.entity';
import { PlayerReport, ReportStatus } from './entities/player-report.entity';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { StadiumsService } from '../stadiums/stadiums.service';
import { BookingsService } from '../bookings/bookings.service';
import { AchievementsService } from '../achievements/achievements.service';
import { RatingsService } from '../ratings/ratings.service';
export declare class GamesService {
    private gamesRepository;
    private statsRepository;
    private chatRepository;
    private noShowRepository;
    private reportRepository;
    private readonly teamsService;
    private readonly usersService;
    private readonly notificationsService;
    private readonly paymentsService;
    private readonly stadiumsService;
    private readonly bookingsService;
    private readonly achievementsService;
    private readonly ratingsService;
    constructor(gamesRepository: Repository<Game>, statsRepository: Repository<GamePlayerStats>, chatRepository: Repository<ChatMessage>, noShowRepository: Repository<NoShow>, reportRepository: Repository<PlayerReport>, teamsService: TeamsService, usersService: UsersService, notificationsService: NotificationsService, paymentsService: PaymentsService, stadiumsService: StadiumsService, bookingsService: BookingsService, achievementsService: AchievementsService, ratingsService: RatingsService);
    findAll(page?: number, limit?: number, status?: string, format?: string, district?: string, metro?: string): Promise<{
        data: Game[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findNearby(lat: number, lng: number, radiusKm?: number): Promise<Game[]>;
    findByTeam(teamId: string): Promise<Game[]>;
    setUrgent(gameId: string, isUrgent: boolean): Promise<Game>;
    private compatibleSkillLevels;
    private sendUrgentNotifications;
    private notifyMatchingPlayers;
    findOne(id: string): Promise<Game>;
    create(gameData: Partial<Game>): Promise<Game>;
    update(id: string, gameData: Partial<Game>): Promise<Game>;
    delete(id: string): Promise<void>;
    joinGame(gameId: string, player: any, referredBy?: string): Promise<Game>;
    private confirmBooking;
    finishGame(id: string, finishData: any): Promise<Game>;
    leaveGame(gameId: string, playerId: string): Promise<Game>;
    cancelExpiredPendingBookings(): Promise<void>;
    smartInvite(gameId: string, filters: any): Promise<{
        invitedCount: number;
        invitedPlayers: string[];
    }>;
    acceptInvite(gameId: string, playerId: string): Promise<{
        success: boolean;
        message: string;
        gameId?: string;
    }>;
    balanceTeams(gameId: string): Promise<{
        teamA: any[];
        teamB: any[];
        avgMmrA: number;
        avgMmrB: number;
    }>;
    calculateSlotPrice(advanceAmount: number, maxPlayers: number, commissionPerPlayer: number): number;
    sendPrivateInvites(gameId: string, playerIds: string[]): Promise<{
        sentCount: number;
    }>;
    saveChatMessage(gameId: string, userId: string, userName: string, message: string, userAvatar?: string): Promise<ChatMessage>;
    getChatMessages(gameId: string): Promise<ChatMessage[]>;
    getGameInvites(gameId: string): Promise<any[]>;
    getUserInvitations(userId: string): Promise<any[]>;
    startFinishGame(id: string, scoreData: {
        scoreTeamA: number;
        scoreTeamB: number;
    }): Promise<Game>;
    claimStats(gameId: string, playerId: string, stats: {
        goals: number;
        assists: number;
    }): Promise<Game>;
    validateStats(gameId: string, organizerId: string, validatedStats: Array<{
        playerId: string;
        goals: number;
        assists: number;
    }>): Promise<Game>;
    getPendingStats(gameId: string): Promise<{
        pendingStats: Record<string, any>;
        scoreTeamA: number;
        scoreTeamB: number;
        validation: {
            teamAGoals: number;
            teamBGoals: number;
            isValid: boolean;
        };
    }>;
    castMvpVote(gameId: string, voterId: string, votedPlayerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    completeGame(gameId: string): Promise<Game>;
    submitPostGame(gameId: string, playerId: string, data: {
        goals: number;
        assists: number;
        mvpVoteId?: string;
        badges?: Array<{
            playerId: string;
            badgeType: string;
        }>;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    private autoCompleteGame;
    reportNoShows(gameId: string, reportedByUserId: string, players: {
        id: string;
        name?: string;
    }[]): Promise<NoShow[]>;
    getNoShows(userId?: string): Promise<NoShow[]>;
    submitReport(data: any): Promise<PlayerReport>;
    getReports(status?: ReportStatus): Promise<PlayerReport[]>;
    updateReport(reportId: string, data: {
        status: ReportStatus;
        adminNote?: string;
    }): Promise<PlayerReport>;
    private localDateStr;
    getHotGames(): Promise<Game[]>;
    sendHotGameNotifications(): Promise<void>;
}
