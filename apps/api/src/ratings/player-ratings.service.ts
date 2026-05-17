import { Injectable } from '@nestjs/common';
import { RatingsDataService } from './ratings-data.service';
import { PlayerRatingResponse } from './interfaces';
import { EventPlacement } from '../generated/prisma-client';

@Injectable()
export class PlayerRatingsService {
  constructor(private readonly ratingsDataService: RatingsDataService) {}

  async updateStatsFromResult(result: {
    userId?: number | null;
    placement: string;
    points: number;
    accuracy?: { toNumber: () => number } | number | null;
    kills?: number | null;
    deaths?: number | null;
  }): Promise<void> {
    if (!result.userId) {
      return;
    }

    const stats = await this.ratingsDataService.findOrCreatePlayerStats(
      result.userId,
    );

    // Определение результата игры
    let wins = stats.wins;
    let losses = stats.losses;
    let draws = stats.draws;

    if (result.placement === EventPlacement.FIRST) {
      wins += 1;
    } else if (
      result.placement === EventPlacement.SECOND ||
      result.placement === EventPlacement.THIRD
    ) {
      losses += 1;
    } else {
      draws += 1;
    }

    const gamesPlayed = stats.gamesPlayed + 1;
    const totalPoints = stats.totalPoints + result.points;
    const averagePoints = totalPoints / gamesPlayed;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    // Обновление статистики
    // Обработка accuracy: может быть number или объект с toNumber()
    const accuracyValue: number | undefined =
      result.accuracy === null || result.accuracy === undefined
        ? undefined
        : typeof result.accuracy === 'number'
          ? result.accuracy
          : result.accuracy.toNumber();

    // Обработка K/D ratio
    let kdRatioValue: number | undefined = undefined;
    if (
      result.kills !== null &&
      result.kills !== undefined &&
      result.deaths !== null &&
      result.deaths !== undefined
    ) {
      if (result.deaths > 0) {
        kdRatioValue = result.kills / result.deaths;
      } else if (result.kills > 0) {
        kdRatioValue = result.kills;
      }
    } else if (stats.kdRatio !== null && stats.kdRatio !== undefined) {
      kdRatioValue =
        typeof stats.kdRatio === 'number'
          ? stats.kdRatio
          : stats.kdRatio.toNumber();
    }

    await this.ratingsDataService.updatePlayerStats(result.userId, {
      gamesPlayed,
      wins,
      losses,
      draws,
      points: result.points, // Текущие очки (можно использовать для сезонных рейтингов)
      totalPoints,
      averagePoints,
      winRate,
      accuracy: accuracyValue,
      kdRatio: kdRatioValue,
    });

    // Пересчет рейтинга
    await this.recalculatePlayerRank(result.userId);
  }

  async rollbackStatsFromResult(result: {
    userId?: number | null;
    placement: string;
    points: number;
  }): Promise<void> {
    if (!result.userId) {
      return;
    }

    const stats = await this.ratingsDataService.findOrCreatePlayerStats(
      result.userId,
    );

    // Откат результата игры
    let wins = stats.wins;
    let losses = stats.losses;
    let draws = stats.draws;

    if (result.placement === EventPlacement.FIRST) {
      wins = Math.max(0, wins - 1);
    } else if (
      result.placement === EventPlacement.SECOND ||
      result.placement === EventPlacement.THIRD
    ) {
      losses = Math.max(0, losses - 1);
    } else {
      draws = Math.max(0, draws - 1);
    }

    const gamesPlayed = Math.max(0, stats.gamesPlayed - 1);
    const totalPoints = Math.max(0, stats.totalPoints - result.points);
    const averagePoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    await this.ratingsDataService.updatePlayerStats(result.userId, {
      gamesPlayed,
      wins,
      losses,
      draws,
      totalPoints,
      averagePoints,
      winRate,
    });

    // Пересчет рейтинга
    await this.recalculatePlayerRank(result.userId);
  }

  async recalculatePlayerRank(userId: number): Promise<void> {
    const stats = await this.ratingsDataService.getPlayerStatsWithUser(userId);
    if (!stats) {
      return;
    }

    // Получаем всех игроков, отсортированных по totalPoints
    const { items } = await this.ratingsDataService.getPlayerLeaderboard(
      'totalPoints',
      'desc',
      10000, // Большое число для получения всех
      0,
    );

    // Находим позицию текущего игрока
    const currentRank = items.findIndex((s) => s.userId === userId) + 1;

    // Обновляем рейтинг
    await this.ratingsDataService.updatePlayerStats(userId, {
      rank: currentRank > 0 ? currentRank : undefined,
      previousRank: stats.rank ?? undefined,
    });
  }

  async getPlayerRating(userId: number): Promise<PlayerRatingResponse | null> {
    const stats = await this.ratingsDataService.getPlayerStatsWithUser(userId);
    if (!stats || !stats.user) {
      return null;
    }

    return {
      userId: stats.userId,
      nickName: stats.user.nickName,
      logoUrl: stats.user.logoUrl || undefined,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      points: stats.points,
      totalPoints: stats.totalPoints,
      averagePoints: stats.averagePoints?.toNumber(),
      accuracy: stats.accuracy?.toNumber(),
      kdRatio: stats.kdRatio?.toNumber(),
      winRate: stats.winRate?.toNumber(),
      rank: stats.rank ?? undefined,
      previousRank: stats.previousRank ?? undefined,
    };
  }

  async getPlayerLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const { items, total } = await this.ratingsDataService.getPlayerLeaderboard(
      sortBy,
      order,
      limit,
      offset,
      searchQuery,
    );

    const ratings: PlayerRatingResponse[] = items
      .filter((item) => item.user)
      .map((item) => ({
        userId: item.userId,
        nickName: item.user.nickName,
        logoUrl: item.user.logoUrl || undefined,
        gamesPlayed: item.gamesPlayed,
        wins: item.wins,
        losses: item.losses,
        draws: item.draws,
        points: item.points,
        totalPoints: item.totalPoints,
        averagePoints: item.averagePoints?.toNumber(),
        accuracy: item.accuracy?.toNumber(),
        kdRatio: item.kdRatio?.toNumber(),
        winRate: item.winRate?.toNumber(),
        rank: item.rank ?? undefined,
        previousRank: item.previousRank ?? undefined,
      }));

    return {
      items: ratings,
      total,
      limit,
      offset,
    };
  }

  async applyManualGameResult(
    userId: number,
    pointsDelta: number,
    isWin: boolean,
  ): Promise<void> {
    const stats = await this.ratingsDataService.findOrCreatePlayerStats(userId);

    const gamesPlayed = stats.gamesPlayed + 1;
    const wins = stats.wins + (isWin ? 1 : 0);
    const losses = stats.losses + (isWin ? 0 : 1);
    const totalPoints = stats.totalPoints + pointsDelta;
    const averagePoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    await this.ratingsDataService.updatePlayerStats(userId, {
      gamesPlayed,
      wins,
      losses,
      draws: stats.draws,
      points: pointsDelta,
      totalPoints,
      averagePoints,
      winRate,
    });

    await this.recalculatePlayerRank(userId);
  }
}
