import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tournament } from './tournament.entity';

export type MatchStage = 'group' | 'quarterfinal' | 'semifinal' | 'final';
export type MatchStatus = 'scheduled' | 'slot_pending' | 'confirmed' | 'played' | 'walkover_home' | 'walkover_away';

@Entity('tournament_matches')
export class TournamentMatch {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tournamentId: string;

    @Column({ type: 'varchar', default: 'group' })
    stage: MatchStage;

    @Column({ nullable: true })
    groupId: string; // 'A', 'B', 'C', 'D' — group stage only

    @Column()
    homeTeamId: string;

    @Column()
    homeTeamName: string;

    @Column({ nullable: true })
    homeTeamLogo: string;

    @Column()
    awayTeamId: string;

    @Column()
    awayTeamName: string;

    @Column({ nullable: true })
    awayTeamLogo: string;

    @Column({ type: 'int', nullable: true })
    homeScore: number;

    @Column({ type: 'int', nullable: true })
    awayScore: number;

    @Column({ type: 'varchar', default: 'scheduled' })
    status: MatchStatus;

    @Column({ nullable: true })
    slotId: string;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deadlineAt: Date;

    @Column({ default: 1 })
    matchday: number;

    @Column({ nullable: true })
    bracketPosition: number; // for playoff visualization

    @Column({ nullable: true })
    winnerId: string;

    @Column({ nullable: true })
    pendingSlotId: string;

    @Column({ nullable: true })
    pendingSlotProposedBy: string;

    // Per-match stats entry tracking
    @Column({ default: false })
    homeStatsEntered: boolean;

    @Column({ default: false })
    awayStatsEntered: boolean;

    // MVP votes (each captain votes for opponent's best player)
    @Column({ nullable: true })
    homeMvpVotePlayerId: string; // home captain votes for away player

    @Column({ nullable: true })
    awayMvpVotePlayerId: string; // away captain votes for home player

    @ManyToOne(() => Tournament, (t) => t.matches, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournamentId' })
    tournament: Tournament;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
