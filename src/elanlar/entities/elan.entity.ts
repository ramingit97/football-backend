import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('elanlar')
export class Elan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    creatorId: string;

    @Column()
    creatorName: string;

    @Column({ nullable: true })
    creatorAvatar: string;

    @Column({ type: 'date' })
    date: string;

    @Column()
    time: string;

    @Column({ nullable: true })
    format: string;

    @Column({ nullable: true })
    district: string;

    @Column({ nullable: true })
    metro: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ type: 'simple-array', nullable: true })
    timeOptions: string[]; // ['19:00', '20:00', '21:00']

    @Column({ type: 'jsonb', default: [] })
    votes: { time: string; userIds: string[] }[];

    @Column({ type: 'jsonb', default: [] })
    interested: { id: string; name: string; avatar?: string }[];

    @Column({ default: 'open' })
    status: string; // open | converted | cancelled

    @Column({ nullable: true })
    convertedGameId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
