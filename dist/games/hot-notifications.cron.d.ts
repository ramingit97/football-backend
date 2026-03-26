import { GamesService } from './games.service';
export declare class HotNotificationsCron {
    private readonly gamesService;
    private readonly logger;
    constructor(gamesService: GamesService);
    handleHotGameNotifications(): Promise<void>;
}
