import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PhoneVerificationCron } from './phone-verification.cron';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Friendship } from './entities/friendship.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Transaction, Friendship, SupportTicket]),
        ScheduleModule.forRoot(),
        forwardRef(() => NotificationsModule),
    ],
    controllers: [UsersController],
    providers: [UsersService, PhoneVerificationCron],
    exports: [UsersService],
})
export class UsersModule {}
