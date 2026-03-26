import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';

@Injectable()
export class AchievementsService {
    constructor(
        @InjectRepository(Achievement)
        private achievementsRepository: Repository<Achievement>,
    ) {}

    async create(data: Partial<Achievement>): Promise<Achievement> {
        const achievement = this.achievementsRepository.create(data);
        return this.achievementsRepository.save(achievement);
    }

    async findByUser(userId: string): Promise<Achievement[]> {
        return this.achievementsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
