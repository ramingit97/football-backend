import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Elan } from './entities/elan.entity';
import { ElanMessage } from './entities/elan-message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ElanlarService {
    constructor(
        @InjectRepository(Elan)
        private elanRepo: Repository<Elan>,
        @InjectRepository(ElanMessage)
        private messageRepo: Repository<ElanMessage>,
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
        private usersService: UsersService,
    ) {}

    async findAll(): Promise<Elan[]> {
        return this.elanRepo.find({
            where: { status: 'open' },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Elan> {
        const elan = await this.elanRepo.findOne({ where: { id } });
        if (!elan) throw new NotFoundException('Elan tapılmadı');
        return elan;
    }

    async create(data: {
        creatorId: string;
        creatorName: string;
        creatorAvatar?: string;
        date: string;
        time?: string;
        timeOptions?: string[];
        format?: string;
        district?: string;
        metro?: string;
        description?: string;
    }): Promise<Elan> {
        const elan = this.elanRepo.create({
            ...data,
            votes: data.timeOptions?.map(t => ({ time: t, userIds: [] })) || [],
            interested: [{ id: data.creatorId, name: data.creatorName, avatar: data.creatorAvatar }],
            status: 'open',
        });
        return this.elanRepo.save(elan);
    }

    async vote(elanId: string, userId: string, time: string): Promise<Elan> {
        const elan = await this.findOne(elanId);

        // Remove previous vote from this user
        elan.votes = elan.votes.map(v => ({
            ...v,
            userIds: v.userIds.filter(id => id !== userId),
        }));

        // Add new vote
        const option = elan.votes.find(v => v.time === time);
        if (option) {
            option.userIds = [...option.userIds, userId];
        }

        return this.elanRepo.save(elan);
    }

    async toggleInterest(elanId: string, user: { id: string; name: string; avatar?: string }): Promise<Elan> {
        const elan = await this.findOne(elanId);
        const idx = elan.interested.findIndex(p => p.id === user.id);

        if (idx === -1) {
            elan.interested = [...elan.interested, user];
        } else {
            elan.interested = elan.interested.filter(p => p.id !== user.id);
        }

        return this.elanRepo.save(elan);
    }

    async convert(elanId: string, userId: string, gameId: string, gameTitle: string): Promise<Elan> {
        const elan = await this.findOne(elanId);
        if (elan.creatorId !== userId) throw new ForbiddenException('Yalnız yaradan çevirə bilər');
        elan.status = 'converted';
        elan.convertedGameId = gameId;
        await this.elanRepo.save(elan);

        // Notify all interested players
        const notifyMsg = `🎮 "${gameTitle}" — ${elan.date} oyunu yaradıldı! Qatılmaq üçün bax.`;
        for (const player of elan.interested) {
            if (player.id === userId) continue;
            this.notificationsService.sendNotification(
                player.id,
                'GAME_CREATED',
                '⚽ Oyun yaradıldı!',
                notifyMsg,
                undefined,
                { gameId },
            ).catch(() => {});
        }

        return elan;
    }

    async cancel(elanId: string, userId: string): Promise<void> {
        const elan = await this.findOne(elanId);
        if (elan.creatorId !== userId) throw new ForbiddenException('Yalnız yaradan silə bilər');
        elan.status = 'cancelled';
        await this.elanRepo.save(elan);
    }

    async smartInvite(elanId: string, creatorId: string): Promise<{ invitedCount: number }> {
        const elan = await this.findOne(elanId);
        const excludeIds = elan.interested.map(p => p.id);

        const result = await this.usersService.smartSearch({
            district: elan.district,
            excludeIds,
            limit: 30,
        });
        const users = (result as any)?.users || result || [];

        for (const user of users) {
            this.notificationsService.sendNotification(
                user.id, 'ELAN_INVITE',
                '📋 Sizi elan maraqlandıra bilər',
                `${elan.creatorName} oynamaq istəyir — ${elan.date} ${elan.time || ''}`,
                undefined,
                { elanId },
            ).catch(() => {});
        }

        return { invitedCount: users.length };
    }

    async getMessages(elanId: string): Promise<ElanMessage[]> {
        return this.messageRepo.find({
            where: { elanId },
            order: { createdAt: 'ASC' },
        });
    }

    async addMessage(elanId: string, userId: string, userName: string, userAvatar: string, message: string): Promise<ElanMessage> {
        const msg = this.messageRepo.create({ elanId, userId, userName, userAvatar, message });
        return this.messageRepo.save(msg);
    }
}
