import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Elan } from './entities/elan.entity';
import { ElanMessage } from './entities/elan-message.entity';
import { ElanlarService } from './elanlar.service';
import { ElanlarController } from './elanlar.controller';
import { ElanlarGateway } from './elanlar.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Elan, ElanMessage]),
        forwardRef(() => NotificationsModule),
        UsersModule,
    ],
    providers: [ElanlarService, ElanlarGateway],
    controllers: [ElanlarController],
    exports: [ElanlarService],
})
export class ElanlarModule {}
