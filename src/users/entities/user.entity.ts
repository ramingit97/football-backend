import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Achievement } from '../../achievements/entities/achievement.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    avatar: string;

    @Column({ default: 'player' })
    role: string;

    @Column({ nullable: true })
    age: number;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    position: string;

    @Column({ nullable: true })
    skillLevel: string;

    @Column({ nullable: true })
    playStyle: string;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    physicalLevel: number;

    @Column({ nullable: true })
    experience: number;

    @Column('simple-array', { nullable: true })
    preferredDays: string[];

    @Column('simple-array', { nullable: true })
    preferredTime: string[];

    @Column('simple-array', { nullable: true })
    preferredAreas: string[];

    @Column({ default: true })
    notifications: boolean;

    @Column({ nullable: true })
    fcmToken: string;

    @Column({ nullable: true })
    height: number;

    @Column({ nullable: true })
    weight: number;

    @Column({ nullable: true })
    favoriteTeam: string;

    @Column({ nullable: true })
    shirtNumber: number;

    @Column({ nullable: true })
    preferredFoot: string;

    @Column('simple-array', { nullable: true })
    formatPreference: string[];

    @Column({ default: 0 })
    xp: number;

    @Column({ default: 1 })
    level: number;

    @OneToMany(() => Achievement, (achievement) => achievement.user)
    achievements: Achievement[];

    @Column({ type: 'float', default: 0 })
    averageRating: number;

    @Column({ type: 'jsonb', default: {} })
    receivedBadges: Record<string, number>;

    @Column({ default: 0 })
    gamesPlayed: number;

    @Column({ default: 0 })
    manOfTheMatchCount: number;

    @Column({ default: 0 })
    totalGoals: number;

    @Column({ default: 0 })
    totalAssists: number;

    @Column({ type: 'float', default: 50 })
    attackRating: number;

    @Column({ type: 'float', default: 50 })
    defenseRating: number;

    @Column({ type: 'float', default: 50 })
    staminaRating: number;

    @Column({ type: 'float', default: 50 })
    speedRating: number;

    @Column({ nullable: true })
    lastPlayedAt: Date;

    @Column({ type: 'jsonb', default: {} })
    playFrequency: object;

    @Column({ type: 'float', nullable: true })
    latitude: number;

    @Column({ type: 'float', nullable: true })
    longitude: number;

    @Column({ nullable: true })
    district: string;

    @Column({ nullable: true })
    ageRange: string;

    @Column({ nullable: true })
    metro: string;

    @Column({ type: 'float', default: 1.00 })
    balance: number;

    @Column({ default: 'ru' })
    language: string;

    @Column({ default: false })
    blocked: boolean;

    @Column({ nullable: true })
    blockedReason: string;

    @Column({ nullable: true })
    blockedAt: Date;

    @Column({ default: 0 })
    noShowCount: number;

    @Column({ default: 0 })
    warningCount: number;

    @Column({ default: false })
    installBonusReceived: boolean;

    @Column({ default: false })
    profileBonusReceived: boolean;

    @Column({ default: false })
    profileCompleted: boolean;

    @Column({ nullable: true, unique: true })
    referralCode: string;

    @Column({ nullable: true })
    referredBy: string;

    @Column({ default: false })
    referralBonusPaid: boolean;

    @Column({ default: false })
    phoneBonusPaid: boolean;

    @Column({ nullable: true })
    phoneVerificationRequestedAt: Date;

    @Column({ nullable: true })
    resetPasswordToken: string;

    @Column({ nullable: true })
    resetPasswordExpires: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
