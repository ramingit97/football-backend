"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const challenge_entity_1 = require("./entities/challenge.entity");
const challenges_service_1 = require("./challenges.service");
const challenges_controller_1 = require("./challenges.controller");
const teams_module_1 = require("../teams/teams.module");
const games_module_1 = require("../games/games.module");
const users_module_1 = require("../users/users.module");
let ChallengesModule = class ChallengesModule {
};
exports.ChallengesModule = ChallengesModule;
exports.ChallengesModule = ChallengesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([challenge_entity_1.Challenge]),
            teams_module_1.TeamsModule,
            (0, common_1.forwardRef)(() => games_module_1.GamesModule),
            users_module_1.UsersModule,
        ],
        controllers: [challenges_controller_1.ChallengesController],
        providers: [challenges_service_1.ChallengesService],
        exports: [challenges_service_1.ChallengesService],
    })
], ChallengesModule);
//# sourceMappingURL=challenges.module.js.map