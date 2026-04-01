import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Stadium } from './entities/stadium.entity';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { BookingsService } from '../bookings/bookings.service';
import { TelegramService } from './telegram.service';

@Injectable()
export class StadiumsService {
    constructor(
        @InjectRepository(Stadium)
        private stadiumsRepository: Repository<Stadium>,
        @Inject(forwardRef(() => BookingsService))
        private bookingsService: BookingsService,
        private telegramService: TelegramService,
    ) { }

    async create(createStadiumDto: CreateStadiumDto): Promise<Stadium> {
        const { suggestedByName, ...data } = createStadiumDto;
        const stadium = this.stadiumsRepository.create({
            ...data,
            status: 'pending',
        });
        return this.stadiumsRepository.save(stadium);
    }

    async notifyAdmin(id: string, submitterName: string): Promise<void> {
        const stadium = await this.findOne(id);
        if (!stadium) return;
        this.telegramService.sendStadiumRequest(stadium, submitterName).catch(() => {});
    }

    // Find only approved stadiums (for users)
    findAll(): Promise<Stadium[]> {
        return this.stadiumsRepository.find({
            where: { status: 'approved' },
        });
    }

    // Find all stadiums regardless of status (for admin)
    findAllAdmin(): Promise<Stadium[]> {
        return this.stadiumsRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    // Find pending stadiums (for admin moderation)
    findPending(): Promise<Stadium[]> {
        return this.stadiumsRepository.find({
            where: { status: 'pending' },
            order: { createdAt: 'ASC' },
        });
    }

    findOne(id: string): Promise<Stadium | null> {
        return this.stadiumsRepository.findOneBy({ id });
    }

    findByOwner(ownerId: string): Promise<Stadium[]> {
        return this.stadiumsRepository.findBy({ ownerId });
    }

    async update(id: string, updateData: Partial<Stadium>): Promise<Stadium | null> {
        await this.stadiumsRepository.update(id, updateData);
        return this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.stadiumsRepository.delete(id);
    }

    // Approve stadium
    async approve(id: string, adminId: string): Promise<Stadium> {
        const stadium = await this.findOne(id);
        if (!stadium) throw new NotFoundException('Stadium not found');

        stadium.status = 'approved';
        stadium.approvedAt = new Date();
        stadium.approvedBy = adminId;
        (stadium as any).rejectionReason = null;

        return this.stadiumsRepository.save(stadium);
    }

    // Reject stadium
    async reject(id: string, reason: string): Promise<Stadium> {
        const stadium = await this.findOne(id);
        if (!stadium) throw new NotFoundException('Stadium not found');

        stadium.status = 'rejected';
        stadium.rejectionReason = reason;

        return this.stadiumsRepository.save(stadium);
    }

    // Suspend stadium
    async suspend(id: string): Promise<Stadium> {
        const stadium = await this.findOne(id);
        if (!stadium) throw new NotFoundException('Stadium not found');

        stadium.status = 'suspended';

        return this.stadiumsRepository.save(stadium);
    }

    // Get statistics for admin
    async getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }> {
        const [total, pending, approved, rejected] = await Promise.all([
            this.stadiumsRepository.count(),
            this.stadiumsRepository.count({ where: { status: 'pending' } }),
            this.stadiumsRepository.count({ where: { status: 'approved' } }),
            this.stadiumsRepository.count({ where: { status: 'rejected' } }),
        ]);
        return { total, pending, approved, rejected };
    }

    async getAvailableSlots(stadiumId: string, date: string): Promise<{ time: string; available: boolean }[]> {
        const stadium = await this.findOne(stadiumId);
        if (!stadium) {
            return [];
        }

        const bookings = await this.bookingsService.findByStadium(stadiumId, date);
        const bookedSlots = new Set(bookings.map(b => b.startTime));

        const slots: { time: string; available: boolean }[] = [];
        const openHour = parseInt(stadium.openTime.split(':')[0]);
        const closeHour = parseInt(stadium.closeTime.split(':')[0]);

        for (let hour = openHour; hour < closeHour; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            slots.push({
                time: timeStr,
                available: !bookedSlots.has(timeStr),
            });
        }

        return slots;
    }
}
