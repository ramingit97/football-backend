import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
    ) {}

    async sendNotification(userId: string, type: string, title?: string, message?: string, fcmToken?: string, metadata?: Record<string, any>) {
        if (!fcmToken) {
            const user = await this.usersService.findOneById(userId);
            fcmToken = user?.fcmToken ?? undefined;
        }

        const notification = this.notificationRepository.create({ userId, type, title, message, isRead: false, metadata: metadata || null });
        const saved = await this.notificationRepository.save(notification);

        if (fcmToken) {
            // Fire-and-forget: не блокируем ответ ожиданием FCM
            const { firebaseApp } = require('../firebase.config');
            firebaseApp.messaging().send({
                token: fcmToken,
                notification: { title, body: message },
                data: { type, userId, notificationId: saved.id.toString() },
            }).catch((e: any) => {
                console.error(`[FCM] Error sending to ${userId}:`, e?.message);
            });
        }

        return saved;
    }

    async getMyNotifications(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async markAsRead(notificationId: string) {
        await this.notificationRepository.update(notificationId, { isRead: true });
        return { success: true };
    }
}
