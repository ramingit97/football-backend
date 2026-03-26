"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RatingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rating_entity_1 = require("./entities/rating.entity");
const game_mvp_vote_entity_1 = require("./entities/game-mvp-vote.entity");
const game_mvp_award_entity_1 = require("./entities/game-mvp-award.entity");
const users_service_1 = require("../users/users.service");
let RatingsService = class RatingsService {
    constructor(ratingsRepository, mvpVotesRepository, mvpAwardRepository, usersService) {
        this.ratingsRepository = ratingsRepository;
        this.mvpVotesRepository = mvpVotesRepository;
        this.mvpAwardRepository = mvpAwardRepository;
        this.usersService = usersService;
    }
    async submitRatings(raterId, submitRatingsDto) {
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
    async castMvpVote(gameId, voterId, votedUserId, teamId) {
        const existingVote = await this.mvpVotesRepository.findOne({
            where: { gameId, voterId }
        });
        if (existingVote) {
            throw new common_1.BadRequestException('Вы уже голосовали за MVP этой игры');
        }
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
    async getMvpResults(gameId) {
        const votes = await this.mvpVotesRepository.find({ where: { gameId } });
        const teamAVotes = {};
        const teamBVotes = {};
        for (const vote of votes) {
            if (vote.teamId === 'A') {
                teamAVotes[vote.votedUserId] = (teamAVotes[vote.votedUserId] || 0) + 1;
            }
            else if (vote.teamId === 'B') {
                teamBVotes[vote.votedUserId] = (teamBVotes[vote.votedUserId] || 0) + 1;
            }
        }
        let mvpTeamAId = null;
        let maxVotesA = 0;
        for (const [userId, count] of Object.entries(teamAVotes)) {
            if (count > maxVotesA) {
                maxVotesA = count;
                mvpTeamAId = userId;
            }
        }
        let mvpTeamBId = null;
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
    async checkAndAssignMvp(gameId) {
        const existingAward = await this.mvpAwardRepository.findOne({ where: { gameId } });
        if (existingAward)
            return;
        const votes = await this.mvpVotesRepository.find({ where: { gameId } });
        if (votes.length < 3)
            return;
        const voteCounts = {};
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
            }
            else if (count === maxVotes) {
                isTie = true;
            }
        }
        if (mvpUserId && !isTie && maxVotes >= 3) {
            console.log(`Assigning MVP for game ${gameId} to user ${mvpUserId}`);
            await this.usersService.incrementMvpCount(mvpUserId);
        }
    }
    async updateUserStats(userId) {
        const ratings = await this.ratingsRepository.find({ where: { ratedUserId: userId } });
        const totalRatings = ratings.length;
        if (totalRatings === 0)
            return;
        const sumSkill = ratings.reduce((acc, r) => acc + r.skillRating, 0);
        const sumBehavior = ratings.reduce((acc, r) => acc + r.behaviorRating, 0);
        const averageRating = (sumSkill + sumBehavior) / (totalRatings * 2);
        await this.usersService.update(userId, {
            averageRating: parseFloat(averageRating.toFixed(2)),
            gamesPlayed: totalRatings
        });
    }
};
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rating_entity_1.PlayerRating)),
    __param(1, (0, typeorm_1.InjectRepository)(game_mvp_vote_entity_1.GameMvpVote)),
    __param(2, (0, typeorm_1.InjectRepository)(game_mvp_award_entity_1.GameMvpAward)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map