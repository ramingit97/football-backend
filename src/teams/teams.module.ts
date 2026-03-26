import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Team, TeamJoinRequest]),
        NotificationsModule,
    ],
    controllers: [TeamsController],
    providers: [TeamsService],
    exports: [TeamsService],
})
export class TeamsModule {}
