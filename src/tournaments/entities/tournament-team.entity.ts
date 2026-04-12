import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tournament } from './tournament.entity';

@Entity('tournament_teams')
export class TournamentTeam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tournamentId: string;

    @Column()
    teamId: string;

    @Column()
    captainId: string;

    @Column()
    teamName: string;

    @Column({ nullable: true })
    teamLogo: string;

    @Column({ nullable: true })
    groupId: string; // 'A', 'B', 'C', 'D'

    @Column({ default: 0 })
    points: number;

    @Column({ default: 0 })
    goalsFor: number;

    @Column({ default: 0 })
    goalsAgainst: number;

    @Column({ default: 0 })
    wins: number;

    @Column({ default: 0 })
    draws: number;

    @Column({ default: 0 })
    losses: number;

    @Column({ default: 0 })
    matchesPlayed: number;

    @Column({ default: false })
    eliminated: boolean;

    @Column({ default: 'pending' })
    paymentStatus: string; // 'pending' | 'paid'

    @ManyToOne(() => Tournament, (t) => t.teams, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournamentId' })
    tournament: Tournament;

    @CreateDateColumn()
    createdAt: Date;
}
