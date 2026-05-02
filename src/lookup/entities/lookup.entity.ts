import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lookups')
export class Lookup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    creatorId: string;

    @Column()
    creatorName: string;

    @Column({ nullable: true })
    creatorAvatar: string;

    @Column({ nullable: true })
    contactPhone: string;

    // optional team link
    @Column({ nullable: true })
    teamId: string;

    @Column({ nullable: true })
    teamName: string;

    @Column()
    format: string; // 5x5 | 6x6 | 7x7 | 8x8 | 11x11

    @Column({ type: 'int', default: 0 })
    playerCount: number; // сколько нас уже есть

    @Column({ type: 'date', nullable: true })
    preferredDate: string;

    @Column({ nullable: true })
    preferredTime: string;

    @Column({ nullable: true })
    district: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ default: 'open' })
    status: string; // open | matched | cancelled

    @Column({ type: 'jsonb', default: [] })
    responses: {
        userId: string;
        userName: string;
        userAvatar?: string;
        teamId?: string;
        teamName?: string;
        message?: string;
        contactPhone?: string;
        createdAt: string;
    }[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
