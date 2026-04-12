import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ClaimStatus = 'none' | 'pending' | 'claimed';

@Entity('tournament_roster_players')
export class TournamentRosterPlayer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    tournamentId: string;

    @Column()
    tournamentTeamId: string; // FK to tournament_teams.id

    @Column()
    teamId: string; // the actual team UUID (from teams table)

    // If the player has an account
    @Column({ nullable: true })
    userId: string | null;

    @Column()
    name: string;

    @Column({ nullable: true })
    number: number | null;

    @Column({ nullable: true, type: 'varchar' })
    position: string | null; // GK | DEF | MID | FWD

    // Claim flow
    @Column({ type: 'varchar', default: 'none' })
    claimStatus: ClaimStatus;

    @Column({ nullable: true })
    pendingClaimUserId: string | null;

    @Column({ nullable: true })
    pendingClaimUserName: string | null;

    // Tournament stats (accumulated across all matches)
    @Column({ type: 'int', default: 0 })
    goals: number;

    @Column({ type: 'int', default: 0 })
    assists: number;

    @Column({ type: 'int', default: 0 })
    mvpCount: number;

    @Column({ type: 'int', default: 0 })
    matchesPlayed: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
