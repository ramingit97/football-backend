import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(createBookingDto: CreateBookingDto): Promise<import("./entities/booking.entity").Booking>;
    findByStadium(stadiumId: string, date: string): Promise<import("./entities/booking.entity").Booking[]>;
    findOne(id: string): Promise<import("./entities/booking.entity").Booking>;
    updateStatus(id: string, status: string): Promise<import("./entities/booking.entity").Booking>;
    updatePlayers(id: string, currentPlayers: number): Promise<import("./entities/booking.entity").Booking>;
}
