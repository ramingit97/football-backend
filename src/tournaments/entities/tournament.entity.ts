import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TournamentTeam } from './tournament-team.entity';
import { TournamentMatch } from './tournament-match.entity';
import { TournamentSlot } from './tournament-slot.entity';

export type TournamentStatus =
    | 'registration'     // Teams registering
    | 'group_draw'       // Live group draw in progress
    | 'group_stage'      // Group matches being played
    | 'playoff_draw'     // Awaiting playoff bracket draw
    | 'playoff'          // Knockout stage
    | 'completed'        // Tournament finished
    | 'cancelled';

@Entity('tournaments')
export class Tournament {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    organizerId: string;

    @Column({ nullable: true })
    organizerName: string;

    @Column()
    format: string; // '5x5', '6x6', '7x7', '8x8', '11x11'

    @Column({ default: 16 })
    maxTeams: number; // 8 or 16

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    entryFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    prizePool: number;

    @Column({ type: 'varchar', default: 'registration' })
    status: TournamentStatus;

    @Column({ type: 'timestamp', nullable: true })
    registrationDeadline: Date;

    @Column({ type: 'timestamp', nullable: true })
    groupStageDeadline: Date;

    @Column({ type: 'timestamp', nullable: true })
    playoffDeadline: Date;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 60 })
    prize1Percent: number;  // % of total pool to 1st place

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
    prize2Percent: number;  // % of total pool to 2nd place

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
    prize3Percent: number;  // % of total pool to 3rd place

    @Column({ nullable: true })
    coverImage: string;

    @Column({ nullable: true })
    location: string;

    @OneToMany(() => TournamentTeam, (tt) => tt.tournament, { cascade: true })
    teams: TournamentTeam[];

    @OneToMany(() => TournamentMatch, (tm) => tm.tournament, { cascade: true })
    matches: TournamentMatch[];

    @OneToMany(() => TournamentSlot, (ts) => ts.tournament, { cascade: true })
    slots: TournamentSlot[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
