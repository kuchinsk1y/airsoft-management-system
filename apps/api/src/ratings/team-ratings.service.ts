import { Injectable } from '@nestjs/common';
import { RatingsDataService } from './ratings-data.service';
import { TeamRatingResponse } from './interfaces';
import { EventPlacement } from '../generated/prisma-client';

@Injectable()
export class TeamRatingsService {
  constructor(private readonly ratingsDataService: RatingsDataService) {}

  async updateStatsFromResult(result: {
    teamId?: number | null;
    placement: string;
    points: number;
  }): Promise<void> {
    if (!result.teamId) {
      return;
    }

    const stats = await this.ratingsDataService.findOrCreateTeamStats(
      result.teamId,
    );

    // Определение результата игры
    let wins = stats.wins;
    if (result.placement === EventPlacement.FIRST) {
      wins += 1;
    }

    const gamesPlayed = stats.gamesPlayed + 1;
    const totalPoints = stats.totalPoints + result.points;
    const averagePoints = totalPoints / gamesPlayed;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    // Обновление статистики
    await this.ratingsDataService.updateTeamStats(result.teamId, {
      gamesPlayed,
      wins,
      totalPoints,
      averagePoints,
      winRate,
    });

    // Пересчет рейтинга
    await this.recalculateTeamRank(result.teamId);
  }

  async rollbackStatsFromResult(result: {
    teamId?: number | null;
    placement: string;
    points: number;
  }): Promise<void> {
    if (!result.teamId) {
      return;
    }

    const stats = await this.ratingsDataService.findOrCreateTeamStats(
      result.teamId,
    );

    // Откат результата игры
    let wins = stats.wins;
    if (result.placement === EventPlacement.FIRST) {
      wins = Math.max(0, wins - 1);
    }

    const gamesPlayed = Math.max(0, stats.gamesPlayed - 1);
    const totalPoints = Math.max(0, stats.totalPoints - result.points);
    const averagePoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    await this.ratingsDataService.updateTeamStats(result.teamId, {
      gamesPlayed,
      wins,
      totalPoints,
      averagePoints,
      winRate,
    });

    // Пересчет рейтинга
    await this.recalculateTeamRank(result.teamId);
  }

  async recalculateTeamRank(teamId: number): Promise<void> {
    const stats = await this.ratingsDataService.getTeamStatsWithTeam(teamId);
    if (!stats) {
      return;
    }

    // Получаем все команды, отсортированные по totalPoints
    const { items } = await this.ratingsDataService.getTeamLeaderboard(
      'totalPoints',
      'desc',
      10000, // Большое число для получения всех
      0,
    );

    // Находим позицию текущей команды
    const currentRank = items.findIndex((s) => s.teamId === teamId) + 1;

    // Обновляем рейтинг
    await this.ratingsDataService.updateTeamStats(teamId, {
      rank: currentRank > 0 ? currentRank : undefined,
    });
  }

  async getTeamRating(teamId: number): Promise<TeamRatingResponse | null> {
    const stats = await this.ratingsDataService.getTeamStatsWithTeam(teamId);
    if (!stats || !stats.team) {
      return null;
    }

    return {
      teamId: stats.teamId,
      name: stats.team.name,
      logoUrl: stats.team.logoUrl || undefined,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      totalPoints: stats.totalPoints,
      averagePoints: stats.averagePoints?.toNumber(),
      winRate: stats.winRate?.toNumber(),
      rank: stats.rank ?? undefined,
      membersCount: stats.team.members.length,
    };
  }

  async getTeamLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const { items, total } = await this.ratingsDataService.getTeamLeaderboard(
      sortBy,
      order,
      limit,
      offset,
      searchQuery,
    );

    const ratings: TeamRatingResponse[] = items
      .filter((item) => item.team)
      .map((item) => ({
        teamId: item.teamId,
        name: item.team.name,
        logoUrl: item.team.logoUrl || undefined,
        gamesPlayed: item.gamesPlayed,
        wins: item.wins,
        totalPoints: item.totalPoints,
        averagePoints: item.averagePoints?.toNumber(),
        winRate: item.winRate?.toNumber(),
        rank: item.rank ?? undefined,
        membersCount: item.team.members.length,
      }));

    return {
      items: ratings,
      total,
      limit,
      offset,
    };
  }

  async applyManualGameResult(
    teamId: number,
    pointsDelta: number,
    isWin: boolean,
  ): Promise<void> {
    const stats = await this.ratingsDataService.findOrCreateTeamStats(teamId);
    const gamesPlayed = stats.gamesPlayed + 1;
    const wins = stats.wins + (isWin ? 1 : 0);
    const totalPoints = stats.totalPoints + pointsDelta;
    const averagePoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    await this.ratingsDataService.updateTeamStats(teamId, {
      gamesPlayed,
      wins,
      totalPoints,
      averagePoints,
      winRate,
    });

    await this.recalculateTeamRank(teamId);
  }
}
