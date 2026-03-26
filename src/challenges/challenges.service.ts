import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { GamesService } from '../games/games.service';
import { TeamsService } from '../teams/teams.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChallengesService {
    constructor(
        @InjectRepository(Challenge)
        private challengesRepository: Repository<Challenge>,
        private readonly gamesService: GamesService,
        private readonly teamsService: TeamsService,
        private readonly usersService: UsersService,
    ) {}

    async create(createChallengeDto: any): Promise<Challenge> {
        const challenge = this.challengesRepository.create(createChallengeDto);
        return this.challengesRepository.save(challenge) as unknown as Promise<Challenge>;
    }

    async findAllByTeam(teamId: string): Promise<Challenge[]> {
        return this.challengesRepository.find({
            where: [{ challengerTeamId: teamId }, { challengedTeamId: teamId }],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Challenge> {
        const challenge = await this.challengesRepository.findOne({ where: { id } });
        if (!challenge) throw new NotFoundException(`Challenge with ID ${id} not found`);
        return challenge;
    }

    private async getUserInfo(userId: string): Promise<any> {
        try {
            return await this.usersService.findOneById(userId);
        } catch {
            return null;
        }
    }

    async respond(id: string, status: 'accepted' | 'rejected'): Promise<Challenge> {
        const challenge = await this.findOne(id);
        challenge.status = status;

        if (status === 'accepted') {
            const challengerTeam = await this.teamsService.findOne(challenge.challengerTeamId);
            const challengedTeam = await this.teamsService.findOne(challenge.challengedTeamId);
            const challengerCaptain = await this.getUserInfo(challengerTeam.captainId);

            const format = (challenge as any).format || '6x6';
            const playersPerTeam = parseInt(format.split('x')[0]) || 6;
            const maxPlayers = playersPerTeam * 2;

            const game = await this.gamesService.create({
                title: `Match: ${challenge.challengerName} vs ${challenge.challengedName}`,
                date: challenge.date,
                time: challenge.time,
                location: challenge.location,
                format,
                teamAColor: '#ff4d4f',
                teamBColor: '#1890ff',
                organizerId: challengerTeam.captainId,
                organizerName: challengerCaptain?.name || challenge.challengerName,
                maxPlayers,
                price: 0,
                gameType: 'private',
                teamAId: challengerTeam.id,
                teamBId: challengedTeam.id,
                teamAName: challenge.challengerName,
                teamBName: challenge.challengedName,
            } as any);

            const allPlayersData = [];
            const teamAPositionCounts: Record<string, number> = {};
            const teamBPositionCounts: Record<string, number> = {};

            const getDefaultPosition = (rawPosition: string, index: number, team: 'A' | 'B') => {
                const isTeamA = team === 'A';
                const baseX = isTeamA ? 10 : 90;
                const posMap: Record<string, { xOffset: number; ySpread: number[] }> = {
                    goalkeeper: { xOffset: 0, ySpread: [50] },
                    defender: { xOffset: isTeamA ? 15 : -15, ySpread: [25, 50, 75, 35, 65] },
                    midfielder: { xOffset: isTeamA ? 30 : -30, ySpread: [20, 40, 60, 80, 50] },
                    forward: { xOffset: isTeamA ? 42 : -42, ySpread: [35, 65, 50, 25, 75] },
                };
                const normalize: Record<string, string> = { gk: 'goalkeeper', def: 'defender', mid: 'midfielder', fwd: 'forward' };
                const pos = normalize[rawPosition?.toLowerCase()] || rawPosition?.toLowerCase() || 'midfielder';
                const config = posMap[pos] || posMap['midfielder'];
                return { x: baseX + config.xOffset, y: config.ySpread[index % config.ySpread.length] };
            };

            for (const playerId of challengerTeam.playerIds || []) {
                const userInfo = await this.getUserInfo(playerId);
                if (userInfo) {
                    const position = userInfo.position || 'midfielder';
                    const posIndex = teamAPositionCounts[position] || 0;
                    teamAPositionCounts[position] = posIndex + 1;
                    const { x, y } = getDefaultPosition(position, posIndex, 'A');
                    allPlayersData.push({ id: playerId, name: userInfo.name, avatar: userInfo.avatar, position, team: 'A', x, y });
                }
            }

            for (const playerId of challengedTeam.playerIds || []) {
                const userInfo = await this.getUserInfo(playerId);
                if (userInfo) {
                    const position = userInfo.position || 'midfielder';
                    const posIndex = teamBPositionCounts[position] || 0;
                    teamBPositionCounts[position] = posIndex + 1;
                    const { x, y } = getDefaultPosition(position, posIndex, 'B');
                    allPlayersData.push({ id: playerId, name: userInfo.name, avatar: userInfo.avatar, position, team: 'B', x, y });
                }
            }

            await this.gamesService.update(game.id, { players: allPlayersData });
            challenge.gameId = game.id;
        }

        return this.challengesRepository.save(challenge);
    }
}
