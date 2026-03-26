import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerRating } from './entities/rating.entity';
import { GameMvpVote } from './entities/game-mvp-vote.entity';
import { GameMvpAward } from './entities/game-mvp-award.entity';
import { SubmitRatingsDto } from './dto/create-rating.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RatingsService {
    constructor(
        @InjectRepository(PlayerRating)
        private ratingsRepository: Repository<PlayerRating>,
        @InjectRepository(GameMvpVote)
        private mvpVotesRepository: Repository<GameMvpVote>,
        @InjectRepository(GameMvpAward)
        private mvpAwardRepository: Repository<GameMvpAward>,
        private usersService: UsersService,
    ) { }

    async submitRatings(raterId: string, submitRatingsDto: SubmitRatingsDto) {
        const { gameId, ratings, mvpVoteUserId } = submitRatingsDto;
        const savedRatings = [];

        for (const ratingData of ratings) {
            const rating = this.ratingsRepository.create({
                gameId,
                raterId,
                ratedUserId: ratingData.ratedUserId,
                skillRating: ratingData.skillRating,
                behaviorRating: ratingData.behaviorRating,
                comment: ratingData.comment,
            });
            await this.ratingsRepository.save(rating);
            savedRatings.push(rating);

            // Recalculate user stats for each rated user
            await this.updateUserStats(ratingData.ratedUserId);
        }

        if (mvpVoteUserId) {
            const vote = this.mvpVotesRepository.create({
                gameId,
                voterId: raterId,
                votedUserId: mvpVoteUserId
            });
            await this.mvpVotesRepository.save(vote);
            await this.checkAndAssignMvp(gameId);
        }

        return savedRatings;
    }

    // New method: Cast MVP vote with team support
    async castMvpVote(gameId: string, voterId: string, votedUserId: string, teamId: string): Promise<{ success: boolean; message: string }> {
        // Check if voter already voted for this game
        const existingVote = await this.mvpVotesRepository.findOne({
            where: { gameId, voterId }
        });

        if (existingVote) {
            throw new BadRequestException('Вы уже голосовали за MVP этой игры');
        }

        // Save the vote
        const vote = this.mvpVotesRepository.create({
            gameId,
            voterId,
            votedUserId,
            teamId
        });
        await this.mvpVotesRepository.save(vote);

        console.log(`MVP vote cast: game ${gameId}, voter ${voterId} voted for ${votedUserId} (team ${teamId})`);
        return { success: true, message: 'Голос принят!' };
    }

    // New method: Get MVP results for a game (per-team)
    async getMvpResults(gameId: string): Promise<{ mvpTeamAId: string | null; mvpTeamBId: string | null }> {
        const votes = await this.mvpVotesRepository.find({ where: { gameId } });

        // Count votes per team
        const teamAVotes: Record<string, number> = {};
        const teamBVotes: Record<string, number> = {};

        for (const vote of votes) {
            if (vote.teamId === 'A') {
                teamAVotes[vote.votedUserId] = (teamAVotes[vote.votedUserId] || 0) + 1;
            } else if (vote.teamId === 'B') {
                teamBVotes[vote.votedUserId] = (teamBVotes[vote.votedUserId] || 0) + 1;
            }
        }

        // Find MVP for Team A
        let mvpTeamAId: string | null = null;
        let maxVotesA = 0;
        for (const [userId, count] of Object.entries(teamAVotes)) {
            if (count > maxVotesA) {
                maxVotesA = count;
                mvpTeamAId = userId;
            }
        }

        // Find MVP for Team B
        let mvpTeamBId: string | null = null;
        let maxVotesB = 0;
        for (const [userId, count] of Object.entries(teamBVotes)) {
            if (count > maxVotesB) {
                maxVotesB = count;
                mvpTeamBId = userId;
            }
        }

        console.log(`MVP results for game ${gameId}: Team A - ${mvpTeamAId} (${maxVotesA} votes), Team B - ${mvpTeamBId} (${maxVotesB} votes)`);
        return { mvpTeamAId, mvpTeamBId };
    }

    private async checkAndAssignMvp(gameId: string) {
        // Check if MVP is already awarded
        const existingAward = await this.mvpAwardRepository.findOne({ where: { gameId } });
        if (existingAward) return;

        const votes = await this.mvpVotesRepository.find({ where: { gameId } });

        // Need at least 3 votes to consider assigning MVP automatically
        if (votes.length < 3) return;

        const voteCounts: Record<string, number> = {};
        votes.forEach(v => {
            voteCounts[v.votedUserId] = (voteCounts[v.votedUserId] || 0) + 1;
        });

        let maxVotes = 0;
        let mvpUserId = null;
        let isTie = false;

        for (const [userId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                mvpUserId = userId;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        }

        // If we have a clear winner efficiently (simple majority or just max votes > 2)
        if (mvpUserId && !isTie && maxVotes >= 3) {
            console.log(`Assigning MVP for game ${gameId} to user ${mvpUserId}`);
            await this.usersService.incrementMvpCount(mvpUserId);
        }
    }

    private async updateUserStats(userId: string) {
        const ratings = await this.ratingsRepository.find({ where: { ratedUserId: userId } });
        const totalRatings = ratings.length;

        if (totalRatings === 0) return;

        const sumSkill = ratings.reduce((acc, r) => acc + r.skillRating, 0);
        const sumBehavior = ratings.reduce((acc, r) => acc + r.behaviorRating, 0);

        // Average of both skill and behavior
        const averageRating = (sumSkill + sumBehavior) / (totalRatings * 2);

        await this.usersService.update(userId, {
            averageRating: parseFloat(averageRating.toFixed(2)),
            gamesPlayed: totalRatings // Simplified: assuming 1 rating per game per player
        });
    }
}
