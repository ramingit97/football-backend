import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';
export declare class GamesGateway {
    private readonly gamesService;
    server: Server;
    constructor(gamesService: GamesService);
    handleJoinGameRoom(gameId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleLeaveGameRoom(gameId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleSelectPosition(data: {
        gameId: string;
        positionIndex: number;
        player: any;
    }, client: Socket): Promise<{
        gameId: string;
        positionIndex: number;
        player: any;
    }>;
    handleJoinGameChat(gameId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleSendMessage(data: {
        gameId: string;
        userId: string;
        userName: string;
        message: string;
        userAvatar?: string;
    }, client: Socket): Promise<import("./entities/chat-message.entity").ChatMessage>;
}
