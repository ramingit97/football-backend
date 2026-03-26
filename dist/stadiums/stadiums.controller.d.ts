import { StadiumsService } from './stadiums.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
export declare class StadiumsController {
    private readonly stadiumsService;
    constructor(stadiumsService: StadiumsService);
    create(createStadiumDto: CreateStadiumDto): Promise<import("./entities/stadium.entity").Stadium>;
    findAll(): Promise<import("./entities/stadium.entity").Stadium[]>;
    findAllAdmin(): Promise<import("./entities/stadium.entity").Stadium[]>;
    findPending(): Promise<import("./entities/stadium.entity").Stadium[]>;
    getStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>;
    approve(id: string, adminId: string): Promise<import("./entities/stadium.entity").Stadium>;
    reject(id: string, reason: string): Promise<import("./entities/stadium.entity").Stadium>;
    suspend(id: string): Promise<import("./entities/stadium.entity").Stadium>;
    findOne(id: string): Promise<import("./entities/stadium.entity").Stadium>;
    findByOwner(ownerId: string): Promise<import("./entities/stadium.entity").Stadium[]>;
    update(id: string, updateData: Partial<CreateStadiumDto>): Promise<import("./entities/stadium.entity").Stadium>;
    delete(id: string): Promise<void>;
    getAvailableSlots(id: string, date: string): Promise<{
        time: string;
        available: boolean;
    }[]>;
}
