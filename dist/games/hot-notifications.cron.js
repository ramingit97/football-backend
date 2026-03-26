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
var HotNotificationsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotNotificationsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const games_service_1 = require("./games.service");
let HotNotificationsCron = HotNotificationsCron_1 = class HotNotificationsCron {
    constructor(gamesService) {
        this.gamesService = gamesService;
        this.logger = new common_1.Logger(HotNotificationsCron_1.name);
    }
    async handleHotGameNotifications() {
        this.logger.log('Running hot game notifications cron...');
        try {
            await this.gamesService.sendHotGameNotifications();
        }
        catch (e) {
            this.logger.error('Hot notifications cron failed:', e.message);
        }
    }
};
exports.HotNotificationsCron = HotNotificationsCron;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HotNotificationsCron.prototype, "handleHotGameNotifications", null);
exports.HotNotificationsCron = HotNotificationsCron = HotNotificationsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], HotNotificationsCron);
//# sourceMappingURL=hot-notifications.cron.js.map