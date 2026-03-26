import { Repository } from 'typeorm';
import { PlayerRating } from './entities/rating.entity';
import { GameMvpVote } from './entities/game-mvp-vote.entity';
import { GameMvpAward } from './entities/game-mvp-award.entity';
import { SubmitRatingsDto } from './dto/create-rating.dto';
import { UsersService } from '../users/users.service';
export declare class RatingsService {
    private ratingsRepository;
    private mvpVotesRepository;
    private mvpAwardRepository;
    private usersService;
    constructor(ratingsRepository: Repository<PlayerRating>, mvpVotesRepository: Repository<GameMvpVote>, mvpAwardRepository: Repository<GameMvpAward>, usersService: UsersService);
    submitRatings(raterId: string, submitRatingsDto: SubmitRatingsDto): Promise<any[]>;
    castMvpVote(gameId: string, voterId: string, votedUserId: string, teamId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getMvpResults(gameId: string): Promise<{
        mvpTeamAId: string | null;
        mvpTeamBId: string | null;
    }>;
    private checkAndAssignMvp;
    private updateUserStats;
}
