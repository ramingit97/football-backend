import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
export declare class AchievementsService {
    private achievementsRepository;
    constructor(achievementsRepository: Repository<Achievement>);
    create(data: Partial<Achievement>): Promise<Achievement>;
    findByUser(userId: string): Promise<Achievement[]>;
}
