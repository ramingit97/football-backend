import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity('game_player_stats')
export class GamePlayerStats {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    gameId: string;

    @ManyToOne(() => Game, (game) => game.stats, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gameId' })
    game: Game;

    @Column()
    playerId: string;

    @Column({ default: 0 })
    goals: number;

    @Column({ default: 0 })
    assists: number;
}
