"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const ratings_module_1 = require("./ratings/ratings.module");
const achievements_module_1 = require("./achievements/achievements.module");
const notifications_module_1 = require("./notifications/notifications.module");
const payments_module_1 = require("./payments/payments.module");
const stadiums_module_1 = require("./stadiums/stadiums.module");
const bookings_module_1 = require("./bookings/bookings.module");
const locations_module_1 = require("./locations/locations.module");
const files_module_1 = require("./files/files.module");
const teams_module_1 = require("./teams/teams.module");
const challenges_module_1 = require("./challenges/challenges.module");
const games_module_1 = require("./games/games.module");
const user_entity_1 = require("./users/entities/user.entity");
const transaction_entity_1 = require("./users/entities/transaction.entity");
const friendship_entity_1 = require("./users/entities/friendship.entity");
const achievement_entity_1 = require("./achievements/entities/achievement.entity");
const rating_entity_1 = require("./ratings/entities/rating.entity");
const game_mvp_vote_entity_1 = require("./ratings/entities/game-mvp-vote.entity");
const game_mvp_award_entity_1 = require("./ratings/entities/game-mvp-award.entity");
const notification_entity_1 = require("./notifications/entities/notification.entity");
const stadium_entity_1 = require("./stadiums/entities/stadium.entity");
const booking_entity_1 = require("./bookings/entities/booking.entity");
const district_entity_1 = require("./locations/entities/district.entity");
const metro_station_entity_1 = require("./locations/entities/metro-station.entity");
const team_entity_1 = require("./teams/entities/team.entity");
const team_join_request_entity_1 = require("./teams/entities/team-join-request.entity");
const challenge_entity_1 = require("./challenges/entities/challenge.entity");
const game_entity_1 = require("./games/entities/game.entity");
const game_player_stats_entity_1 = require("./games/entities/game-player-stats.entity");
const chat_message_entity_1 = require("./games/entities/chat-message.entity");
const no_show_entity_1 = require("./games/entities/no-show.entity");
const player_report_entity_1 = require("./games/entities/player-report.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: parseInt(configService.get('DB_PORT', '5432'), 10),
                    username: configService.get('DB_USERNAME', 'postgres'),
                    password: configService.get('DB_PASSWORD', 'password'),
                    database: configService.get('DB_DATABASE', 'football_db'),
                    entities: [
                        user_entity_1.User, transaction_entity_1.Transaction, friendship_entity_1.Friendship,
                        achievement_entity_1.Achievement,
                        rating_entity_1.PlayerRating, game_mvp_vote_entity_1.GameMvpVote, game_mvp_award_entity_1.GameMvpAward,
                        notification_entity_1.Notification,
                        stadium_entity_1.Stadium, booking_entity_1.Booking,
                        district_entity_1.District, metro_station_entity_1.MetroStation,
                        team_entity_1.Team, team_join_request_entity_1.TeamJoinRequest,
                        challenge_entity_1.Challenge,
                        game_entity_1.Game, game_player_stats_entity_1.GamePlayerStats, chat_message_entity_1.ChatMessage, no_show_entity_1.NoShow, player_report_entity_1.PlayerReport,
                    ],
                    synchronize: true,
                    retryAttempts: 10,
                    retryDelay: 3000,
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            ratings_module_1.RatingsModule,
            achievements_module_1.AchievementsModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
            stadiums_module_1.StadiumsModule,
            bookings_module_1.BookingsModule,
            locations_module_1.LocationsModule,
            files_module_1.FilesModule,
            teams_module_1.TeamsModule,
            challenges_module_1.ChallengesModule,
            games_module_1.GamesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map