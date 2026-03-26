import { Game } from './game.entity';
export declare class ChatMessage {
    id: string;
    gameId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    message: string;
    createdAt: Date;
    game: Game;
}
