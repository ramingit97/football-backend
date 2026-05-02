import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lookup } from './entities/lookup.entity';
import { LookupMessage } from './entities/lookup-message.entity';
import { LookupService } from './lookup.service';
import { LookupController } from './lookup.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Lookup, LookupMessage]),
        forwardRef(() => NotificationsModule),
    ],
    providers: [LookupService],
    controllers: [LookupController],
    exports: [LookupService],
})
export class LookupModule {}
