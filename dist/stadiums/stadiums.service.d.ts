import { Repository } from 'typeorm';
import { Stadium } from './entities/stadium.entity';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { BookingsService } from '../bookings/bookings.service';
export declare class StadiumsService {
    private stadiumsRepository;
    private bookingsService;
    constructor(stadiumsRepository: Repository<Stadium>, bookingsService: BookingsService);
    create(createStadiumDto: CreateStadiumDto): Promise<Stadium>;
    findAll(): Promise<Stadium[]>;
    findAllAdmin(): Promise<Stadium[]>;
    findPending(): Promise<Stadium[]>;
    findOne(id: string): Promise<Stadium | null>;
    findByOwner(ownerId: string): Promise<Stadium[]>;
    update(id: string, updateData: Partial<Stadium>): Promise<Stadium | null>;
    delete(id: string): Promise<void>;
    approve(id: string, adminId: string): Promise<Stadium>;
    reject(id: string, reason: string): Promise<Stadium>;
    suspend(id: string): Promise<Stadium>;
    getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>;
    getAvailableSlots(stadiumId: string, date: string): Promise<{
        time: string;
        available: boolean;
    }[]>;
}
