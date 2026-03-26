import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GamesService } from './games.service';

@Injectable()
export class HotNotificationsCron {
    private readonly logger = new Logger(HotNotificationsCron.name);

    constructor(private readonly gamesService: GamesService) {}

    @Cron('0 */30 * * * *')
    async handleHotGameNotifications() {
        this.logger.log('Running hot game notifications cron...');
        try {
            await this.gamesService.sendHotGameNotifications();
        } catch (e) {
            this.logger.error('Hot notifications cron failed:', e.message);
        }
    }
}
