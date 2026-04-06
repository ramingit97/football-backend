import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GamePlayerStats } from './game-player-stats.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('games')
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    date: Date;

    @Column({ nullable: true })
    title: string;

    @Column()
    time: string;

    @Column()
    location: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column()
    maxPlayers: number;

    @Column({ default: 0 })
    minPlayers: number;

    @Column({ default: '5x5' })
    format: string;

    @Column({ type: 'jsonb', default: [] })
    players: any[];

    @Column({ default: 'open' })
    status: string;

    @Column({ nullable: true })
    scoreTeamA: number;

    @Column({ nullable: true })
    scoreTeamB: number;

    @Column({ nullable: true })
    mvpId: string;

    @Column({ nullable: true })
    organizerId: string;

    @Column({ nullable: true })
    organizerName: string;

    @Column({ nullable: true })
    stadiumId: string;

    @Column({ nullable: true })
    district: string;

    @Column({ type: 'varchar', nullable: true })
    formationA: string;

    @Column({ type: 'varchar', nullable: true })
    formationB: string;

    @Column({ type: 'varchar', nullable: true })
    teamAColor: string;

    @Column({ type: 'varchar', nullable: true })
    teamBColor: string;

    @Column({ type: 'jsonb', nullable: true })
    formationCoordinates: any;

    @Column({ nullable: true })
    metro: string;

    @Column({ nullable: true })
    bookingId: string;

    @Column({ default: 'pending' })
    bookingStatus: string;

    @Column({ default: 'public' })
    gameType: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    slotPrice: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    organizerFee: number;

    @Column('simple-array', { nullable: true })
    invitedPlayers: string[];

    @Column({ type: 'jsonb', default: {} })
    pendingInvites: object;

    @Column({ type: 'jsonb', default: [] })
    teamA: any[];

    @Column({ type: 'jsonb', default: [] })
    teamB: any[];

    @Column({ default: false })
    teamsBalanced: boolean;

    @Column({ nullable: true })
    teamAId: string;

    @Column({ nullable: true })
    teamBId: string;

    @Column({ nullable: true })
    teamAName: string;

    @Column({ nullable: true })
    teamBName: string;

    @Column({ default: 'any' })
    skillLevel: string;

    @Column({ default: 60 })
    duration: number;

    @Column({ default: false })
    isUrgent: boolean;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6, nullable: true })
    longitude: number;

    @Column({ default: 'active' })
    gamePhase: string;

    @Column({ nullable: true })
    mvpTeamAId?: string;

    @Column({ nullable: true })
    mvpTeamBId?: string;

    @Column({ type: 'jsonb', default: {} })
    pendingPlayerStats: object;

    @Column({ default: false })
    statsValidated: boolean;

    @Column({ nullable: true })
    votingEndsAt: Date;

    @Column({ type: 'jsonb', default: [] })
    referrals: Array<{ referrerId: string; referredUserId: string; bonusPaid: boolean }>;

    @Column({ nullable: true })
    gameSaverId: string;

    @Column({ type: 'jsonb', default: [] })
    hotNotifiedPlayerIds: string[];

    @Column({ default: 'none' })
    recurrence: string; // 'none' | 'weekly' | 'biweekly'

    @Column({ nullable: true })
    minAge: number;

    @Column({ nullable: true })
    maxAge: number;

    // ── Своя игра (own game mode) ──────────────────────────
    @Column({ default: 'marketplace' })
    gameMode: string; // 'marketplace' | 'own'

    @Column({ nullable: true })
    customLocation: string; // Free text address for own games

    @Column({ default: 0 })
    guestCount: number; // How many players organizer already has

    @Column({ type: 'jsonb', default: [] })
    guests: Array<{
        id: string;
        name: string;
        userId?: string;       // Set if guest registered
        inviteToken?: string;  // Token for invite link
        paid?: boolean;        // Payment tracking
        paymentMethod?: string; // 'wallet' | 'cash' | 'card'
    }>;

    @Column({ default: 'self' })
    legionPaymentType: string; // 'self' | 'cash' | 'organizer'

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    organizerCoversAmount: number; // Per-slot amount when organizer pays for legionnaires

    @Column({ type: 'jsonb', default: [] })
    paymentTracking: Array<{
        playerId: string;
        name: string;
        status: string;        // 'paid_wallet' | 'paid_cash' | 'paid_card' | 'owes'
        amount: number;
        isGuest: boolean;
    }>;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => GamePlayerStats, (stats) => stats.game)
    stats: GamePlayerStats[];

    @OneToMany(() => ChatMessage, message => message.game)
    chatMessages: ChatMessage[];
}
