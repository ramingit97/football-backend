"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePlayerStats = void 0;
const typeorm_1 = require("typeorm");
const game_entity_1 = require("./game.entity");
let GamePlayerStats = class GamePlayerStats {
};
exports.GamePlayerStats = GamePlayerStats;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GamePlayerStats.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GamePlayerStats.prototype, "gameId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => game_entity_1.Game, (game) => game.stats, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'gameId' }),
    __metadata("design:type", game_entity_1.Game)
], GamePlayerStats.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GamePlayerStats.prototype, "playerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "goals", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GamePlayerStats.prototype, "assists", void 0);
exports.GamePlayerStats = GamePlayerStats = __decorate([
    (0, typeorm_1.Entity)('game_player_stats')
], GamePlayerStats);
//# sourceMappingURL=game-player-stats.entity.js.map