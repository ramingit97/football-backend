import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lookup } from './entities/lookup.entity';
import { LookupMessage } from './entities/lookup-message.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LookupService {
    constructor(
        @InjectRepository(Lookup)
        private lookupRepo: Repository<Lookup>,
        @InjectRepository(LookupMessage)
        private messageRepo: Repository<LookupMessage>,
        private readonly notificationsService: NotificationsService,
    ) {}

    async findAll(filters: { format?: string; district?: string; status?: string } = {}) {
        const qb = this.lookupRepo.createQueryBuilder('l');
        qb.where('l.status = :status', { status: filters.status || 'open' });
        if (filters.format) qb.andWhere('l.format = :format', { format: filters.format });
        if (filters.district) qb.andWhere('l.district = :district', { district: filters.district });
        qb.orderBy('l.createdAt', 'DESC');
        return qb.getMany();
    }

    async findOne(id: string) {
        const lookup = await this.lookupRepo.findOne({ where: { id } });
        if (!lookup) throw new NotFoundException('Объявление не найдено');
        return lookup;
    }

    async create(data: Partial<Lookup>) {
        const lookup = this.lookupRepo.create(data);
        const saved = await this.lookupRepo.save(lookup);

        // Broadcast to all users with bilingual FCM push
        const district = data.district || '';
        const districtRu = district ? ` · ${district}` : '';
        const districtAz = district ? ` · ${district}` : '';
        this.notificationsService.broadcastToAll(
            '', '',
            'LOOKUP_CREATED',
            { creatorName: data.creatorName, format: data.format, district, lookupId: saved.id },
            {
                titleRu: `⚔️ ${data.creatorName} ищет соперника!`,
                messageRu: `Формат ${data.format}${districtRu} — хотите сразиться? Откликнитесь!`,
                titleAz: `⚔️ ${data.creatorName} rəqib axtarır!`,
                messageAz: `Format ${data.format}${districtAz} — döyüşmək istəyirsiniz? Cavab verin!`,
            },
        ).catch(e => console.error('lookup broadcast failed:', e.message));

        return saved;
    }

    async respond(id: string, response: {
        userId: string;
        userName: string;
        userAvatar?: string;
        teamId?: string;
        teamName?: string;
        message?: string;
        contactPhone?: string;
    }) {
        const lookup = await this.findOne(id);
        if (lookup.status !== 'open') throw new ForbiddenException('Объявление уже закрыто');
        if (lookup.creatorId === response.userId) throw new ForbiddenException('Нельзя откликнуться на своё объявление');

        const already = (lookup.responses || []).some(r => r.userId === response.userId);
        if (already) throw new ForbiddenException('Вы уже откликнулись');

        lookup.responses = [...(lookup.responses || []), { ...response, createdAt: new Date().toISOString() }];
        const saved = await this.lookupRepo.save(lookup);

        // Notify creator
        this.notificationsService.sendNotification(
            lookup.creatorId,
            'LOOKUP_RESPONSE',
            '', '',
            undefined,
            { userName: response.userName, lookupId: id },
        ).catch(() => {});

        return saved;
    }

    async sendMessage(id: string, data: { userId: string; userName: string; userAvatar?: string; message: string }) {
        const lookup = await this.findOne(id);
        const msg = this.messageRepo.create({ lookupId: id, ...data });
        return this.messageRepo.save(msg);
    }

    async getMessages(id: string) {
        return this.messageRepo.find({
            where: { lookupId: id },
            order: { createdAt: 'ASC' },
        });
    }

    async updateStatus(id: string, userId: string, status: 'matched' | 'cancelled') {
        const lookup = await this.findOne(id);
        if (lookup.creatorId !== userId) throw new ForbiddenException('Только создатель может изменить статус');
        lookup.status = status;
        return this.lookupRepo.save(lookup);
    }
}
