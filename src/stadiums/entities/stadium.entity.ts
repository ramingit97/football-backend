import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('stadiums')
export class Stadium {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    location: string;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    longitude: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    pricePerHour: number;

    @Column()
    openTime: string;

    @Column()
    closeTime: string;

    @Column({ nullable: true })
    district: string;

    @Column({ nullable: true })
    metro: string;

    @Column({ nullable: true })
    stadiumLink: string;

    @Column('simple-array', { nullable: true })
    amenities: string[];

    @Column('simple-array', { nullable: true })
    images: string[];

    @Column()
    ownerId: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    rejectionReason: string;

    @Column({ nullable: true })
    approvedAt: Date;

    @Column({ nullable: true })
    approvedBy: string;

    @Column({ default: false })
    advanceRequired: boolean;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    advanceAmount: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0.5 })
    commissionPerPlayer: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
