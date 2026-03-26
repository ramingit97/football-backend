import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('pay')
    pay(@Body() body: { userId: string; amount: number; gameId: string }) {
        return this.paymentsService.processPayment(body.userId, body.amount, body.gameId);
    }

    @Post('top-up')
    topUp(@Body() body: { userId: string; amount: number }) {
        return this.paymentsService.topUp(body.userId, body.amount);
    }

    @Post('refund')
    refund(@Body() body: { transactionId: string; userId: string; amount: number }) {
        return this.paymentsService.refundToWallet(body.userId, body.amount);
    }
}
