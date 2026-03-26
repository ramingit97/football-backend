import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('player_ratings')
export class PlayerRating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameId: string;

    @Column()
    raterId: string;

    @Column()
    ratedUserId: string;

    @Column()
    skillRating: number;

    @Column()
    behaviorRating: number;

    @Column({ nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;
}
