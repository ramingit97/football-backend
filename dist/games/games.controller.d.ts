import { GamesService } from './games.service';
import { Game } from './entities/game.entity';
import { FinishGameDto } from './dto/finish-game.dto';
import type { ReportType, ReportStatus } from './entities/player-report.entity';
export declare class GamesController {
    private readonly gamesService;
    constructor(gamesService: GamesService);
    findAll(page?: string, limit?: string, status?: string, format?: string, district?: string, metro?: string): Promise<{
        data: Game[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findNearby(lat: number, lng: number, radius: number): Promise<Game[]>;
    getHotGames(): Promise<Game[]>;
    findOne(id: string): Promise<Game>;
    findByTeam(teamId: string): Promise<Game[]>;
    create(gameData: Partial<Game>): Promise<Game>;
    update(id: string, gameData: Partial<Game>): Promise<Game>;
    setUrgent(id: string, body: {
        isUrgent: boolean;
    }): Promise<Game>;
    delete(id: string): Promise<void>;
    joinGame(id: string, body: any): Promise<Game>;
    finishGame(id: string, finishData: FinishGameDto): Promise<Game>;
    leaveGame(id: string, body: {
        playerId: string;
    }): Promise<Game>;
    smartInvite(id: string, filters: {
        skillLevel?: string;
        district?: string;
        minAge?: number;
        maxAge?: number;
        limit?: number;
    }): Promise<{
        invitedCount: number;
        invitedPlayers: string[];
    }>;
    acceptInvite(id: string, body: {
        playerId: string;
    }): Promise<{
        success: boolean;
        message: string;
        gameId?: string;
    }>;
    balanceTeams(id: string): Promise<{
        teamA: any[];
        teamB: any[];
        avgMmrA: number;
        avgMmrB: number;
    }>;
    sendPrivateInvites(id: string, body: {
        playerIds: string[];
    }): Promise<{
        sentCount: number;
    }>;
    getGameInvites(id: string): Promise<any[]>;
    getUserInvitations(userId: string): Promise<any[]>;
    startFinishGame(id: string, scoreData: {
        scoreTeamA: number;
        scoreTeamB: number;
    }): Promise<Game>;
    claimStats(id: string, body: {
        playerId: string;
        goals: number;
        assists: number;
    }): Promise<Game>;
    getPendingStats(id: string): Promise<{
        pendingStats: Record<string, any>;
        scoreTeamA: number;
        scoreTeamB: number;
        validation: {
            teamAGoals: number;
            teamBGoals: number;
            isValid: boolean;
        };
    }>;
    validateStats(id: string, body: {
        organizerId: string;
        stats: Array<{
            playerId: string;
            goals: number;
            assists: number;
        }>;
    }): Promise<Game>;
    castMvpVote(id: string, body: {
        voterId: string;
        votedPlayerId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    completeGame(id: string): Promise<Game>;
    submitPostGame(id: string, body: {
        playerId: string;
        goals: number;
        assists: number;
        mvpVoteId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    reportNoShows(id: string, body: {
        reportedByUserId: string;
        players: {
            id: string;
            name?: string;
        }[];
    }): Promise<import("./entities/no-show.entity").NoShow[]>;
    getAllNoShows(userId?: string): Promise<import("./entities/no-show.entity").NoShow[]>;
    getUserNoShows(userId: string): Promise<import("./entities/no-show.entity").NoShow[]>;
    submitReport(body: {
        reporterId: string;
        reporterName?: string;
        reportedUserId: string;
        reportedUserName?: string;
        gameId?: string;
        type: ReportType;
        description?: string;
    }): Promise<import("./entities/player-report.entity").PlayerReport>;
    getReports(status?: ReportStatus): Promise<import("./entities/player-report.entity").PlayerReport[]>;
    updateReport(id: string, body: {
        status: ReportStatus;
        adminNote?: string;
    }): Promise<import("./entities/player-report.entity").PlayerReport>;
}
