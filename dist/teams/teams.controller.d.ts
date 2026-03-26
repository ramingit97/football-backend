import { TeamsService } from './teams.service';
export declare class TeamsController {
    private readonly teamsService;
    constructor(teamsService: TeamsService);
    create(createTeamDto: any): Promise<import("./entities/team.entity").Team>;
    findAll(minRating?: string, maxRating?: string, page?: string, limit?: string, sortBy?: 'rating' | 'wins' | 'gamesPlayed', sortOrder?: 'ASC' | 'DESC'): Promise<{
        teams: import("./entities/team.entity").Team[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMyTeams(userId: string): Promise<import("./entities/team.entity").Team[]>;
    getMyRequests(req: any, userId: string): Promise<import("./entities/team-join-request.entity").TeamJoinRequest[]>;
    findOne(id: string): Promise<import("./entities/team.entity").Team>;
    join(id: string, userId: string): Promise<import("./entities/team.entity").Team>;
    leave(id: string, userId: string): Promise<import("./entities/team.entity").Team>;
    requestJoin(id: string, userId: string): Promise<import("./entities/team-join-request.entity").TeamJoinRequest>;
    invitePlayer(id: string, userId: string): Promise<import("./entities/team-join-request.entity").TeamJoinRequest>;
    getRequests(id: string): Promise<import("./entities/team-join-request.entity").TeamJoinRequest[]>;
    respondToRequest(requestId: string, status: 'approved' | 'rejected'): Promise<import("./entities/team-join-request.entity").TeamJoinRequest>;
    transferCaptain(id: string, newCaptainId: string, currentUserId: string): Promise<import("./entities/team.entity").Team>;
    updateFormation(id: string, formation: {
        playerId: string;
        position: string;
        x: number;
        y: number;
    }[], currentUserId: string): Promise<import("./entities/team.entity").Team>;
    updateFormationByFormat(id: string, gameFormat: string, formationString: string, players: {
        playerId: string;
        position: string;
        x: number;
        y: number;
    }[], currentUserId: string): Promise<import("./entities/team.entity").Team>;
    getFormationByFormat(id: string, gameFormat: string): Promise<{
        formationString: string;
        players: {
            playerId: string;
            position: string;
            x: number;
            y: number;
        }[];
    }>;
    updateFlag(id: string, flagUrl: string, currentUserId: string): Promise<import("./entities/team.entity").Team>;
    updateReservePlayers(id: string, reservePlayerIds: string[], currentUserId: string): Promise<import("./entities/team.entity").Team>;
    updateMatchResult(winnerId: string, loserId: string, isDraw: boolean): Promise<void>;
}
