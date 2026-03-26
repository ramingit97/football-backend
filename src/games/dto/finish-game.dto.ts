export class PlayerGameStatsDto {
    playerId: string;
    goals: number;
    assists: number;
}

export class FinishGameDto {
    scoreTeamA: number;
    scoreTeamB: number;
    mvpId?: string;
    playerStats?: PlayerGameStatsDto[];
}
