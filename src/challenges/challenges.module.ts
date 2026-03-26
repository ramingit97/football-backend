import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { TeamsModule } from '../teams/teams.module';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Challenge]),
        TeamsModule,
        forwardRef(() => GamesModule),
        UsersModule,
    ],
    controllers: [ChallengesController],
    providers: [ChallengesService],
    exports: [ChallengesService],
})
export class ChallengesModule {}
