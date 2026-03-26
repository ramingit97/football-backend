"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StadiumsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stadium_entity_1 = require("./entities/stadium.entity");
const bookings_service_1 = require("../bookings/bookings.service");
let StadiumsService = class StadiumsService {
    constructor(stadiumsRepository, bookingsService) {
        this.stadiumsRepository = stadiumsRepository;
        this.bookingsService = bookingsService;
    }
    create(createStadiumDto) {
        const stadium = this.stadiumsRepository.create({
            ...createStadiumDto,
            status: 'pending',
        });
        return this.stadiumsRepository.save(stadium);
    }
    findAll() {
        return this.stadiumsRepository.find({
            where: { status: 'approved' },
        });
    }
    findAllAdmin() {
        return this.stadiumsRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    findPending() {
        return this.stadiumsRepository.find({
            where: { status: 'pending' },
            order: { createdAt: 'ASC' },
        });
    }
    findOne(id) {
        return this.stadiumsRepository.findOneBy({ id });
    }
    findByOwner(ownerId) {
        return this.stadiumsRepository.findBy({ ownerId });
    }
    async update(id, updateData) {
        await this.stadiumsRepository.update(id, updateData);
        return this.findOne(id);
    }
    async delete(id) {
        await this.stadiumsRepository.delete(id);
    }
    async approve(id, adminId) {
        const stadium = await this.findOne(id);
        if (!stadium)
            throw new common_1.NotFoundException('Stadium not found');
        stadium.status = 'approved';
        stadium.approvedAt = new Date();
        stadium.approvedBy = adminId;
        stadium.rejectionReason = null;
        return this.stadiumsRepository.save(stadium);
    }
    async reject(id, reason) {
        const stadium = await this.findOne(id);
        if (!stadium)
            throw new common_1.NotFoundException('Stadium not found');
        stadium.status = 'rejected';
        stadium.rejectionReason = reason;
        return this.stadiumsRepository.save(stadium);
    }
    async suspend(id) {
        const stadium = await this.findOne(id);
        if (!stadium)
            throw new common_1.NotFoundException('Stadium not found');
        stadium.status = 'suspended';
        return this.stadiumsRepository.save(stadium);
    }
    async getStats() {
        const [total, pending, approved, rejected] = await Promise.all([
            this.stadiumsRepository.count(),
            this.stadiumsRepository.count({ where: { status: 'pending' } }),
            this.stadiumsRepository.count({ where: { status: 'approved' } }),
            this.stadiumsRepository.count({ where: { status: 'rejected' } }),
        ]);
        return { total, pending, approved, rejected };
    }
    async getAvailableSlots(stadiumId, date) {
        const stadium = await this.findOne(stadiumId);
        if (!stadium) {
            return [];
        }
        const bookings = await this.bookingsService.findByStadium(stadiumId, date);
        const bookedSlots = new Set(bookings.map(b => b.startTime));
        const slots = [];
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
};
exports.StadiumsService = StadiumsService;
exports.StadiumsService = StadiumsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stadium_entity_1.Stadium)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => bookings_service_1.BookingsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        bookings_service_1.BookingsService])
], StadiumsService);
//# sourceMappingURL=stadiums.service.js.map