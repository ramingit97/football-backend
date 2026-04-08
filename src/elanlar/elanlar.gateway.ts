import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ElanlarService } from './elanlar.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class ElanlarGateway {
    @WebSocketServer()
    server: Server;

    constructor(private elanlarService: ElanlarService) {}

    @SubscribeMessage('elan_join')
    handleJoin(@MessageBody() data: { elanId: string }, @ConnectedSocket() client: Socket) {
        client.join(`elan_${data.elanId}`);
    }

    @SubscribeMessage('elan_leave')
    handleLeave(@MessageBody() data: { elanId: string }, @ConnectedSocket() client: Socket) {
        client.leave(`elan_${data.elanId}`);
    }

    @SubscribeMessage('elan_message')
    async handleMessage(
        @MessageBody() data: { elanId: string; userId: string; userName: string; userAvatar?: string; message: string },
        @ConnectedSocket() client: Socket,
    ) {
        const msg = await this.elanlarService.addMessage(
            data.elanId, data.userId, data.userName, data.userAvatar || '', data.message,
        );
        this.server.to(`elan_${data.elanId}`).emit('elan_message', msg);
    }

    @SubscribeMessage('elan_interest')
    async handleInterest(
        @MessageBody() data: { elanId: string; userId: string; name: string; avatar?: string },
    ) {
        const updated = await this.elanlarService.toggleInterest(data.elanId, {
            id: data.userId, name: data.name, avatar: data.avatar,
        });
        this.server.to(`elan_${data.elanId}`).emit('elan_updated', updated);
    }

    @SubscribeMessage('elan_vote')
    async handleVote(
        @MessageBody() data: { elanId: string; userId: string; time: string },
    ) {
        const updated = await this.elanlarService.vote(data.elanId, data.userId, data.time);
        this.server.to(`elan_${data.elanId}`).emit('elan_updated', updated);
    }
}
