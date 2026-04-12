import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class TournamentsGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinTournamentRoom')
    handleJoinRoom(@MessageBody() tournamentId: string, @ConnectedSocket() client: Socket) {
        client.join(`tournament_${tournamentId}`);
        return { event: 'joinedTournamentRoom', data: tournamentId };
    }

    @SubscribeMessage('leaveTournamentRoom')
    handleLeaveRoom(@MessageBody() tournamentId: string, @ConnectedSocket() client: Socket) {
        client.leave(`tournament_${tournamentId}`);
        return { event: 'leftTournamentRoom', data: tournamentId };
    }

    emitToTournament(tournamentId: string, event: string, data: any) {
        this.server?.to(`tournament_${tournamentId}`).emit(event, data);
    }
}
