import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsService {
    private bookingsRepository;
    constructor(bookingsRepository: Repository<Booking>);
    create(createBookingDto: CreateBookingDto): Promise<Booking>;
    findByStadium(stadiumId: string, date: string): Promise<Booking[]>;
    findOne(id: string): Promise<Booking | null>;
    updateStatus(id: string, status: string): Promise<Booking | null>;
    updatePlayerCount(id: string, currentPlayers: number): Promise<Booking | null>;
    findPendingToCancel(): Promise<Booking[]>;
}
