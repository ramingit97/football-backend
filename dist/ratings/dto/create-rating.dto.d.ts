export declare class RatingItemDto {
    ratedUserId: string;
    skillRating: number;
    behaviorRating: number;
    comment?: string;
}
export declare class SubmitRatingsDto {
    gameId: string;
    ratings: RatingItemDto[];
    mvpVoteUserId?: string;
}
