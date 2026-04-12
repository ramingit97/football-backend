import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { TournamentTeam } from './entities/tournament-team.entity';
import { TournamentMatch } from './entities/tournament-match.entity';
import { TournamentSlot } from './entities/tournament-slot.entity';
import { TournamentRosterPlayer } from './entities/tournament-roster-player.entity';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { TournamentsGateway } from './tournaments.gateway';
import { TeamsModule } from '../teams/teams.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tournament, TournamentTeam, TournamentMatch, TournamentSlot, TournamentRosterPlayer]),
        TeamsModule,
        UsersModule,
        NotificationsModule,
    ],
    controllers: [TournamentsController],
    providers: [TournamentsService, TournamentsGateway],
    exports: [TournamentsService],
})
export class TournamentsModule {}
