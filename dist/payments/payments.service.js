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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let PaymentsService = class PaymentsService {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async processPayment(userId, amount, gameId) {
        try {
            await this.usersService.updateBalance(userId, -amount);
            return {
                status: 'success',
                transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                amount,
                currency: 'AZN',
                method: 'wallet',
            };
        }
        catch (error) {
            if (error.message?.includes('Insufficient funds')) {
                throw new common_1.BadRequestException('Insufficient funds');
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async topUp(userId, amount) {
        const isCardCharged = Math.random() > 0.05;
        if (!isCardCharged)
            throw new common_1.InternalServerErrorException('Card payment failed');
        const user = await this.usersService.updateBalance(userId, amount);
        return {
            status: 'success',
            newBalance: user.balance,
            transactionId: `topup_${Date.now()}`,
        };
    }
    async refundPayment(body) {
        await this.usersService.updateBalance(body.userId, body.amount);
        return { status: 'refunded', transactionId: body.transactionId, refundedAt: new Date() };
    }
    async refundToWallet(userId, amount) {
        await this.usersService.updateBalance(userId, amount);
        return { status: 'refunded_to_wallet', userId, amount };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map