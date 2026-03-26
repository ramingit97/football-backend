"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const games_service_1 = require("./games.service");
let GamesGateway = class GamesGateway {
    constructor(gamesService) {
        this.gamesService = gamesService;
    }
    handleJoinGameRoom(gameId, client) {
        client.join(`game_${gameId}`);
        return { event: 'joinedRoom', data: gameId };
    }
    handleLeaveGameRoom(gameId, client) {
        client.leave(`game_${gameId}`);
        return { event: 'leftRoom', data: gameId };
    }
    async handleSelectPosition(data, client) {
        this.server.to(`game_${data.gameId}`).emit('positionSelected', data);
        return data;
    }
    handleJoinGameChat(gameId, client) {
        client.join(`game_chat_${gameId}`);
        return { event: 'joinedChat', data: gameId };
    }
    async handleSendMessage(data, client) {
        const savedMessage = await this.gamesService.saveChatMessage(data.gameId, data.userId, data.userName, data.message, data.userAvatar);
        this.server.to(`game_chat_${data.gameId}`).emit('newMessage', savedMessage);
        return savedMessage;
    }
};
exports.GamesGateway = GamesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GamesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinGameRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GamesGateway.prototype, "handleJoinGameRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveGameRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GamesGateway.prototype, "handleLeaveGameRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('selectPosition'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GamesGateway.prototype, "handleSelectPosition", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinGameChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], GamesGateway.prototype, "handleJoinGameChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GamesGateway.prototype, "handleSendMessage", null);
exports.GamesGateway = GamesGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [games_service_1.GamesService])
], GamesGateway);
//# sourceMappingURL=games.gateway.js.map