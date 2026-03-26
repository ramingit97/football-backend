export class RatingItemDto {
    ratedUserId: string;
    skillRating: number;
    behaviorRating: number;
    comment?: string;
}

export class SubmitRatingsDto {
    gameId: string;
    ratings: RatingItemDto[];
    mvpVoteUserId?: string;
}
