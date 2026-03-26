import { RatingsService } from './ratings.service';
import { SubmitRatingsDto } from './dto/create-rating.dto';
export declare class RatingsController {
    private readonly ratingsService;
    constructor(ratingsService: RatingsService);
    create(req: any, submitRatingsDto: SubmitRatingsDto): Promise<any[]>;
    castMvpVote(body: {
        gameId: string;
        voterId: string;
        votedUserId: string;
        teamId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getMvpResults(gameId: string): Promise<{
        mvpTeamAId: string | null;
        mvpTeamBId: string | null;
    }>;
}
