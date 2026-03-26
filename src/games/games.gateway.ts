import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GamesGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly gamesService: GamesService) {}

    @SubscribeMessage('joinGameRoom')
    handleJoinGameRoom(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
        client.join(`game_${gameId}`);
        return { event: 'joinedRoom', data: gameId };
    }

    @SubscribeMessage('leaveGameRoom')
    handleLeaveGameRoom(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
        client.leave(`game_${gameId}`);
        return { event: 'leftRoom', data: gameId };
    }

    @SubscribeMessage('selectPosition')
    async handleSelectPosition(@MessageBody() data: { gameId: string; positionIndex: number; player: any }, @ConnectedSocket() client: Socket) {
        this.server.to(`game_${data.gameId}`).emit('positionSelected', data);
        return data;
    }

    @SubscribeMessage('joinGameChat')
    handleJoinGameChat(@MessageBody() gameId: string, @ConnectedSocket() client: Socket) {
        client.join(`game_chat_${gameId}`);
        return { event: 'joinedChat', data: gameId };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() data: { gameId: string; userId: string; userName: string; message: string; userAvatar?: string },
        @ConnectedSocket() client: Socket,
    ) {
        const savedMessage = await this.gamesService.saveChatMessage(data.gameId, data.userId, data.userName, data.message, data.userAvatar);
        this.server.to(`game_chat_${data.gameId}`).emit('newMessage', savedMessage);
        return savedMessage;
    }
}
