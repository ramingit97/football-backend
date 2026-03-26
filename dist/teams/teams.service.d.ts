import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TeamsService {
    private teamsRepository;
    private requestsRepository;
    private readonly notificationsService;
    constructor(teamsRepository: Repository<Team>, requestsRepository: Repository<TeamJoinRequest>, notificationsService: NotificationsService);
    create(createTeamDto: any): Promise<Team>;
    findAll(): Promise<Team[]>;
    findOne(id: string): Promise<Team>;
    findByCaptain(captainId: string): Promise<Team | null>;
    joinTeam(teamId: string, userId: string): Promise<Team>;
    leaveTeam(teamId: string, userId: string): Promise<Team>;
    getMyTeams(userId: string): Promise<Team[]>;
    requestJoin(teamId: string, userId: string): Promise<TeamJoinRequest>;
    invitePlayer(teamId: string, userId: string): Promise<TeamJoinRequest>;
    getRequests(teamId: string): Promise<TeamJoinRequest[]>;
    getMyRequests(userId: string): Promise<TeamJoinRequest[]>;
    respondToRequest(requestId: string, status: 'approved' | 'rejected'): Promise<TeamJoinRequest>;
    transferCaptain(teamId: string, newCaptainId: string, currentUserId: string): Promise<Team>;
    findAllFiltered(filters?: any): Promise<{
        teams: Team[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateFormation(teamId: string, formation: any[], currentUserId: string): Promise<Team>;
    updateFormationByFormat(teamId: string, gameFormat: string, formationString: string, players: any[], currentUserId: string): Promise<Team>;
    getFormationByFormat(teamId: string, gameFormat: string): Promise<{
        formationString: string;
        players: {
            playerId: string;
            position: string;
            x: number;
            y: number;
        }[];
    }>;
    updateFlag(teamId: string, flagUrl: string, currentUserId: string): Promise<Team>;
    updateReservePlayers(teamId: string, reservePlayerIds: string[], currentUserId: string): Promise<Team>;
    updateStatsAfterMatch(winnerId: string, loserId: string, isDraw?: boolean): Promise<void>;
    update(id: string, updateData: Partial<Team>): Promise<Team>;
    delete(id: string): Promise<void>;
}
