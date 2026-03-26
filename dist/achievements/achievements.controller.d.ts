import { AchievementsService } from './achievements.service';
export declare class AchievementsController {
    private readonly achievementsService;
    constructor(achievementsService: AchievementsService);
    create(data: any): Promise<import("./entities/achievement.entity").Achievement>;
    findByUser(userId: string): Promise<import("./entities/achievement.entity").Achievement[]>;
}
