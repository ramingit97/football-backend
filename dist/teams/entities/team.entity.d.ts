export declare class Team {
    id: string;
    name: string;
    logo: string;
    captainId: string;
    playerIds: string[];
    wins: number;
    losses: number;
    draws: number;
    rating: number;
    gamesPlayed: number;
    reservePlayerIds: string[];
    formation: {
        playerId: string;
        position: string;
        x: number;
        y: number;
    }[];
    formations: {
        [format: string]: {
            formationString: string;
            players: {
                playerId: string;
                position: string;
                x: number;
                y: number;
            }[];
        };
    };
    flag: string;
    createdAt: Date;
    updatedAt: Date;
}
