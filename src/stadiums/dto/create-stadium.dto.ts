export class CreateStadiumDto {
    name: string;
    location: string;
    description?: string;
    pricePerHour: number;
    openTime: string;
    closeTime: string;
    district?: string;
    metro?: string;
    stadiumLink?: string;
    amenities?: string[];
    images?: string[];
    ownerId: string;
    advanceRequired?: boolean;
    advanceAmount?: number;
    commissionPerPlayer?: number;
}
