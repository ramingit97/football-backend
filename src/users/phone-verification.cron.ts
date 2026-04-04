import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from './users.service';

@Injectable()
export class PhoneVerificationCron {
    constructor(private readonly usersService: UsersService) {}

    @Cron(CronExpression.EVERY_5_MINUTES)
    async autoApproveExpired() {
        await this.usersService.autoApproveExpiredPhoneVerifications();
    }
}
