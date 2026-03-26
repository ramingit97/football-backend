export declare class PlayerGameStatsDto {
    playerId: string;
    goals: number;
    assists: number;
}
export declare class FinishGameDto {
    scoreTeamA: number;
    scoreTeamB: number;
    mvpId?: string;
    playerStats?: PlayerGameStatsDto[];
}
