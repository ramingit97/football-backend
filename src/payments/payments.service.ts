import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
    constructor(private readonly usersService: UsersService) {}

    async processPayment(userId: string, amount: number, gameId: string) {
        try {
            await this.usersService.updateBalance(userId, -amount);
            return {
                status: 'success',
                transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                amount,
                currency: 'AZN',
                method: 'wallet',
            };
        } catch (error) {
            if (error.message?.includes('Insufficient funds')) {
                throw new BadRequestException('Insufficient funds');
            }
            throw new InternalServerErrorException(error.message);
        }
    }

    async topUp(userId: string, amount: number) {
        const isCardCharged = Math.random() > 0.05;
        if (!isCardCharged) throw new InternalServerErrorException('Card payment failed');

        const user = await this.usersService.updateBalance(userId, amount);
        return {
            status: 'success',
            newBalance: user.balance,
            transactionId: `topup_${Date.now()}`,
        };
    }

    async refundPayment(body: { userId: string; amount: number; transactionId: string }) {
        await this.usersService.updateBalance(body.userId, body.amount);
        return { status: 'refunded', transactionId: body.transactionId, refundedAt: new Date() };
    }

    async refundToWallet(userId: string, amount: number) {
        await this.usersService.updateBalance(userId, amount);
        return { status: 'refunded_to_wallet', userId, amount };
    }
}
