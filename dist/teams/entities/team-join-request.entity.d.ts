import { Team } from './team.entity';
export declare class TeamJoinRequest {
    id: string;
    teamId: string;
    userId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    team: Team;
}
