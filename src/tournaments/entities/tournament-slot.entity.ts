import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tournament } from './tournament.entity';

@Entity('tournament_slots')
export class TournamentSlot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tournamentId: string;

    @Column()
    stadiumId: string;

    @Column({ nullable: true })
    stadiumName: string;

    @Column({ nullable: true })
    stadiumAddress: string;

    @Column()
    date: string; // 'YYYY-MM-DD'

    @Column()
    startTime: string; // 'HH:MM'

    @Column()
    endTime: string; // 'HH:MM'

    @Column({ default: 'available' })
    status: string; // 'available' | 'reserved' | 'confirmed'

    @Column({ nullable: true })
    reservedForMatchId: string;

    @Column({ type: 'timestamp', nullable: true })
    reservedAt: Date;

    @ManyToOne(() => Tournament, (t) => t.slots, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournamentId' })
    tournament: Tournament;

    @CreateDateColumn()
    createdAt: Date;
}
