import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
export declare class NotificationsService {
    private notificationRepository;
    private readonly usersService;
    constructor(notificationRepository: Repository<Notification>, usersService: UsersService);
    sendNotification(userId: string, type: string, title?: string, message?: string, fcmToken?: string, metadata?: Record<string, any>): Promise<Notification>;
    getMyNotifications(userId: string): Promise<Notification[]>;
    markAsRead(notificationId: string): Promise<{
        success: boolean;
    }>;
}
