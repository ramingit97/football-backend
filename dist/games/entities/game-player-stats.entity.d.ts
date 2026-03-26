import { Game } from './game.entity';
export declare class GamePlayerStats {
    id: string;
    gameId: string;
    game: Game;
    playerId: string;
    goals: number;
    assists: number;
}
