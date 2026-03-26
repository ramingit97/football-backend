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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("./entities/notification.entity");
const users_service_1 = require("../users/users.service");
let NotificationsService = class NotificationsService {
    constructor(notificationRepository, usersService) {
        this.notificationRepository = notificationRepository;
        this.usersService = usersService;
    }
    async sendNotification(userId, type, title, message, fcmToken, metadata) {
        if (!fcmToken) {
            const user = await this.usersService.findOneById(userId);
            fcmToken = user?.fcmToken ?? undefined;
        }
        const notification = this.notificationRepository.create({ userId, type, title, message, isRead: false, metadata: metadata || null });
        const saved = await this.notificationRepository.save(notification);
        if (fcmToken) {
            const { firebaseApp } = require('../firebase.config');
            firebaseApp.messaging().send({
                token: fcmToken,
                notification: { title, body: message },
                data: { type, userId, notificationId: saved.id.toString() },
            }).catch((e) => {
                console.error(`[FCM] Error sending to ${userId}:`, e?.message);
            });
        }
        return saved;
    }
    async getMyNotifications(userId) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async markAsRead(notificationId) {
        await this.notificationRepository.update(notificationId, { isRead: true });
        return { success: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => users_service_1.UsersService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map