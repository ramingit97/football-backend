import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('game_mvp_votes')
export class GameMvpVote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameId: string;

    @Column()
    voterId: string;

    @Column()
    votedUserId: string;

    @Column({ nullable: true })
    teamId: string;

    @CreateDateColumn()
    createdAt: Date;
}
