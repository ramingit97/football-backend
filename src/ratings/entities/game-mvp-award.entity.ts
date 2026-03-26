import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('game_mvp_awards')
export class GameMvpAward {
    @PrimaryColumn()
    gameId: string;

    @Column()
    mvpUserId: string;

    @CreateDateColumn()
    awardedAt: Date;
}
