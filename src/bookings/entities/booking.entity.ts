import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Stadium } from '../../stadiums/entities/stadium.entity';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    stadiumId: string;

    @ManyToOne(() => Stadium)
    stadium: Stadium;

    @Column()
    date: string;

    @Column()
    startTime: string;

    @Column()
    endTime: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    customerName: string;

    @Column({ nullable: true })
    customerPhone: string;

    @Column({ nullable: true })
    gameId: string;

    @Column({ nullable: true })
    gameName: string;

    @Column({ default: 0 })
    currentPlayers: number;

    @Column({ default: 0 })
    maxPlayers: number;

    @Column({ default: 0 })
    minPlayers: number;

    @Column({ nullable: true })
    organizerName: string;

    @Column({ nullable: true })
    organizerPhone: string;

    @Column({ nullable: true })
    gameFormat: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
