export class CreateTournamentDto {
    name: string;
    description?: string;
    format: string;       // '5x5', '6x6', '7x7', '8x8', '11x11'
    maxTeams: number;     // 8 or 16
    entryFee: number;
    prizePool: number;
    prize1Percent?: number;  // default 60
    prize2Percent?: number;  // default 20
    prize3Percent?: number;  // default 5
    registrationDeadline?: string;
    groupStageDeadline?: string;
    playoffDeadline?: string;
    coverImage?: string;
    location?: string;
}

export class RegisterTeamDto {
    teamId: string;
}

export class AddSlotDto {
    stadiumId: string;
    stadiumName: string;
    stadiumAddress?: string;
    date: string;         // 'YYYY-MM-DD'
    startTime: string;    // 'HH:MM'
    endTime: string;      // 'HH:MM'
}

export class EnterScoreDto {
    homeScore: number;
    awayScore: number;
    winnerId?: string;    // required for playoff draw (penalty winner)
}

export class ProposeSlotDto {
    slotId: string;
}

export class RespondSlotDto {
    accept: boolean;
}

export class WalkoverDto {
    winnerTeamId: string;
}

export class AddRosterPlayerDto {
    name: string;
    number?: number;
    position?: string;     // GK | DEF | MID | FWD
    userId?: string;       // if player already has an account
}

export class ClaimRosterPlayerDto {
    // no body needed — userId comes from JWT
}

export class PlayerStatDto {
    playerId: string;
    goals: number;
    assists: number;
}

export class EnterMatchStatsDto {
    playerStats: PlayerStatDto[];
}

export class MvpVoteDto {
    playerId: string; // opponent's roster player id
}

export class ApproveClaimDto {
    approve: boolean;
}
