import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { StadiumsModule } from '../stadiums/stadiums.module';

@Module({
    imports: [TypeOrmModule.forFeature([SupportTicket]), StadiumsModule],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule {}
