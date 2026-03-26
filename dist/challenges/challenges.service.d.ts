import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { GamesService } from '../games/games.service';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';
export declare class ChallengesService {
    private challengesRepository;
    private readonly gamesService;
    private readonly teamsService;
    private readonly usersService;
    constructor(challengesRepository: Repository<Challenge>, gamesService: GamesService, teamsService: TeamsService, usersService: UsersService);
    create(createChallengeDto: any): Promise<Challenge>;
    findAllByTeam(teamId: string): Promise<Challenge[]>;
    findOne(id: string): Promise<Challenge>;
    private getUserInfo;
    respond(id: string, status: 'accepted' | 'rejected'): Promise<Challenge>;
}
