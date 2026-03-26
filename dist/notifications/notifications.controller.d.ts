import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    send(body: {
        userId: string;
        type: string;
        title: string;
        message: string;
        fcmToken?: string;
    }): Promise<import("./entities/notification.entity").Notification>;
    getMy(userId: string): Promise<import("./entities/notification.entity").Notification[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
    }>;
}
