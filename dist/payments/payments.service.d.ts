import { UsersService } from '../users/users.service';
export declare class PaymentsService {
    private readonly usersService;
    constructor(usersService: UsersService);
    processPayment(userId: string, amount: number, gameId: string): Promise<{
        status: string;
        transactionId: string;
        amount: number;
        currency: string;
        method: string;
    }>;
    topUp(userId: string, amount: number): Promise<{
        status: string;
        newBalance: number;
        transactionId: string;
    }>;
    refundPayment(body: {
        userId: string;
        amount: number;
        transactionId: string;
    }): Promise<{
        status: string;
        transactionId: string;
        refundedAt: Date;
    }>;
    refundToWallet(userId: string, amount: number): Promise<{
        status: string;
        userId: string;
        amount: number;
    }>;
}
