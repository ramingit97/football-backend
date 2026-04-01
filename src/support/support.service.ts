import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { TelegramService } from '../stadiums/telegram.service';

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportTicket)
        private ticketRepo: Repository<SupportTicket>,
        private readonly telegramService: TelegramService,
    ) {}

    async create(userId: string, userName: string, userEmail: string, message: string, silent = false): Promise<SupportTicket> {
        const ticket = this.ticketRepo.create({ userId, userName, userEmail, message, status: 'open' });
        const saved = await this.ticketRepo.save(ticket);

        if (!silent) {
            const text = [
                `💬 <b>Yeni dəstək müraciəti</b>`,
                ``,
                `👤 <b>${userName}</b>${userEmail ? ` (${userEmail})` : ''}`,
                `🆔 <code>${saved.id.slice(0, 8)}</code>`,
                ``,
                `${message}`,
                ``,
                `↩️ Cavab: <code>/reply ${saved.id} mətn</code>`,
            ].join('\n');

            this.telegramService.sendMessage(process.env.TELEGRAM_CHAT_ID || '', text).catch(() => {});
        }

        return saved;
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

    async createSystemNotification(userId: string, text: string): Promise<SupportTicket> {
        const ticket = this.ticketRepo.create({
            userId,
            userName: '🤖 Sistem',
            userEmail: '',
            message: '',
            reply: text,
            status: 'replied',
        });
        return this.ticketRepo.save(ticket);
    }
}
