import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingsRepository: Repository<Booking>,
    ) { }

    create(createBookingDto: CreateBookingDto): Promise<Booking> {
        const booking = this.bookingsRepository.create({
            ...createBookingDto,
            status: 'pending',
        });
        return this.bookingsRepository.save(booking);
    }

    findByStadium(stadiumId: string, date: string): Promise<Booking[]> {
        return this.bookingsRepository.find({
            where: { stadiumId, date },
        });
    }

    findOne(id: string): Promise<Booking | null> {
        return this.bookingsRepository.findOneBy({ id });
    }

    async updateStatus(id: string, status: string): Promise<Booking | null> {
        const booking = await this.findOne(id);
        if (!booking) return null;
        booking.status = status;
        return this.bookingsRepository.save(booking);
    }

    async updatePlayerCount(id: string, currentPlayers: number): Promise<Booking | null> {
        const booking = await this.findOne(id);
        if (!booking) return null;
        booking.currentPlayers = currentPlayers;
        return this.bookingsRepository.save(booking);
    }

    // Find pending bookings that should be cancelled (24h before game)
    async findPendingToCancel(): Promise<Booking[]> {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() + 24);
        const dateStr = cutoffDate.toISOString().split('T')[0];

        return this.bookingsRepository.find({
            where: {
                status: 'pending',
                date: dateStr,
            },
        });
    }
}
