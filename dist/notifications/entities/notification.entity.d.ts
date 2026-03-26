export declare class Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
}
