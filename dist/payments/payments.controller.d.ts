import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    pay(body: {
        userId: string;
        amount: number;
        gameId: string;
    }): Promise<{
        status: string;
        transactionId: string;
        amount: number;
        currency: string;
        method: string;
    }>;
    topUp(body: {
        userId: string;
        amount: number;
    }): Promise<{
        status: string;
        newBalance: number;
        transactionId: string;
    }>;
    refund(body: {
        transactionId: string;
        userId: string;
        amount: number;
    }): Promise<{
        status: string;
        userId: string;
        amount: number;
    }>;
}
