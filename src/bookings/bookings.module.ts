import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { StadiumsModule } from '../stadiums/stadiums.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking]),
        forwardRef(() => StadiumsModule),
    ],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [BookingsService],
})
export class BookingsModule {}
