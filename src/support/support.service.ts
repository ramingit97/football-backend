import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportTicket)
        private ticketRepo: Repository<SupportTicket>,
    ) {}

    async create(userId: string, userName: string, userEmail: string, message: string): Promise<SupportTicket> {
        const ticket = this.ticketRepo.create({ userId, userName, userEmail, message, status: 'open' });
        return this.ticketRepo.save(ticket);
    }

    async findByUser(userId: string): Promise<SupportTicket[]> {
        return this.ticketRepo.find({
            where: { userId },
            order: { createdAt: 'ASC' },
        });
    }

    async findAll(): Promise<SupportTicket[]> {
        return this.ticketRepo.find({ order: { createdAt: 'DESC' } });
    }

    async findOpen(): Promise<SupportTicket[]> {
        return this.ticketRepo.find({
            where: { status: 'open' },
            order: { createdAt: 'ASC' },
        });
    }

    async reply(ticketId: string, replyText: string): Promise<SupportTicket> {
        const ticket = await this.ticketRepo.findOneBy({ id: ticketId });
        if (!ticket) throw new NotFoundException('Ticket not found');
        ticket.reply = replyText;
        ticket.status = 'replied';
        return this.ticketRepo.save(ticket);
    }

    async findOne(id: string): Promise<SupportTicket | null> {
        return this.ticketRepo.findOneBy({ id });
    }
}
