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
    suggestedByName?: string; // display name for Telegram notification only, not persisted
    advanceRequired?: boolean;
    advanceAmount?: number;
    commissionPerPlayer?: number;
}
