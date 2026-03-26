import { User } from '../../users/entities/user.entity';
export declare class Achievement {
    id: string;
    userId: string;
    user: User;
    type: string;
    title: string;
    description: string;
    gameId: string;
    createdAt: Date;
}
