"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const game_entity_1 = require("./entities/game.entity");
const game_player_stats_entity_1 = require("./entities/game-player-stats.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const no_show_entity_1 = require("./entities/no-show.entity");
const player_report_entity_1 = require("./entities/player-report.entity");
const games_service_1 = require("./games.service");
const games_controller_1 = require("./games.controller");
const games_gateway_1 = require("./games.gateway");
const hot_notifications_cron_1 = require("./hot-notifications.cron");
const teams_module_1 = require("../teams/teams.module");
const users_module_1 = require("../users/users.module");
const notifications_module_1 = require("../notifications/notifications.module");
const payments_module_1 = require("../payments/payments.module");
const stadiums_module_1 = require("../stadiums/stadiums.module");
const bookings_module_1 = require("../bookings/bookings.module");
const achievements_module_1 = require("../achievements/achievements.module");
const ratings_module_1 = require("../ratings/ratings.module");
let GamesModule = class GamesModule {
};
exports.GamesModule = GamesModule;
exports.GamesModule = GamesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([game_entity_1.Game, game_player_stats_entity_1.GamePlayerStats, chat_message_entity_1.ChatMessage, no_show_entity_1.NoShow, player_report_entity_1.PlayerReport]),
            schedule_1.ScheduleModule.forRoot(),
            teams_module_1.TeamsModule,
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
            payments_module_1.PaymentsModule,
            stadiums_module_1.StadiumsModule,
            bookings_module_1.BookingsModule,
            achievements_module_1.AchievementsModule,
            ratings_module_1.RatingsModule,
        ],
        controllers: [games_controller_1.GamesController],
        providers: [games_service_1.GamesService, games_gateway_1.GamesGateway, hot_notifications_cron_1.HotNotificationsCron],
        exports: [games_service_1.GamesService],
    })
], GamesModule);
//# sourceMappingURL=games.module.js.map