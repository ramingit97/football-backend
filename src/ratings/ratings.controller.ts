import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { SubmitRatingsDto } from './dto/create-rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ratings')
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req: any, @Body() submitRatingsDto: SubmitRatingsDto) {
        return this.ratingsService.submitRatings(req.user.userId, submitRatingsDto);
    }

    @Post('mvp-vote')
    castMvpVote(@Body() body: { gameId: string; voterId: string; votedUserId: string; teamId: string }) {
        return this.ratingsService.castMvpVote(body.gameId, body.voterId, body.votedUserId, body.teamId);
    }

    @Get('mvp-results/:gameId')
    getMvpResults(@Param('gameId') gameId: string) {
        return this.ratingsService.getMvpResults(gameId);
    }
}
