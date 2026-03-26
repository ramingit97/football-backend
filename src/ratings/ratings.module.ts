import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerRating } from './entities/rating.entity';
import { GameMvpVote } from './entities/game-mvp-vote.entity';
import { GameMvpAward } from './entities/game-mvp-award.entity';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PlayerRating, GameMvpVote, GameMvpAward]),
        UsersModule,
    ],
    providers: [RatingsService],
    controllers: [RatingsController],
    exports: [RatingsService],
})
export class RatingsModule {}
