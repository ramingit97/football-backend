import { Stadium } from '../../stadiums/entities/stadium.entity';
export declare class Booking {
    id: string;
    stadiumId: string;
    stadium: Stadium;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    userId: string;
    customerName: string;
    customerPhone: string;
    gameId: string;
    gameName: string;
    currentPlayers: number;
    maxPlayers: number;
    minPlayers: number;
    organizerName: string;
    organizerPhone: string;
    gameFormat: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
