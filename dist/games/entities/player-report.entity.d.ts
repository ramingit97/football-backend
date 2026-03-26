export type ReportType = 'no_show' | 'toxic_behavior' | 'cheating' | 'unsportsmanlike' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export declare class PlayerReport {
    id: string;
    reporterId: string;
    reporterName: string;
    reportedUserId: string;
    reportedUserName: string;
    gameId: string;
    type: ReportType;
    description: string;
    status: ReportStatus;
    adminNote: string;
    createdAt: Date;
    updatedAt: Date;
}
