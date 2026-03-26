import { ChallengesService } from './challenges.service';
export declare class ChallengesController {
    private readonly challengesService;
    constructor(challengesService: ChallengesService);
    create(createChallengeDto: any): Promise<import("./entities/challenge.entity").Challenge>;
    findAllByTeam(teamId: string): Promise<import("./entities/challenge.entity").Challenge[]>;
    respond(id: string, status: 'accepted' | 'rejected'): Promise<import("./entities/challenge.entity").Challenge>;
}
