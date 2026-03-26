export class CreateBookingDto {
    stadiumId: string;
    date: string;
    startTime: string;
    endTime: string;
    userId?: string;
    customerName?: string;
    customerPhone?: string;
    gameId?: string;
    gameName?: string;
    currentPlayers?: number;
    maxPlayers?: number;
    minPlayers?: number;
    gameFormat?: string;
    price?: number;
}
