import { Injectable } from '@nestjs/common';
import { RatingsDataService } from './ratings-data.service';
import { OrganizerRatingResponse } from './interfaces';

@Injectable()
export class OrganizerRatingsService {
  constructor(private readonly ratingsDataService: RatingsDataService) {}

  async applyOrganizerDelta(
    userId: number,
    pointsDelta: number,
  ): Promise<void> {
    const stats =
      await this.ratingsDataService.findOrCreateOrganizerStats(userId);
    const gamesOrganized = stats.gamesOrganized + 1;
    const totalPoints = stats.totalPoints + pointsDelta;
    const averagePoints =
      gamesOrganized > 0 ? totalPoints / gamesOrganized : totalPoints;

    await this.ratingsDataService.updateOrganizerStats(userId, {
      gamesOrganized,
      totalPoints,
      averagePoints,
    });

    await this.recalculateOrganizerRank(userId);
  }

  async recalculateOrganizerRank(userId: number): Promise<void> {
    const stats =
      await this.ratingsDataService.getOrganizerStatsWithUser(userId);
    if (!stats) {
      return;
    }

    const { items } = await this.ratingsDataService.getOrganizerLeaderboard(
      'totalPoints',
      'desc',
      10000,
      0,
    );

    const currentRank = items.findIndex((s) => s.userId === userId) + 1;

    await this.ratingsDataService.updateOrganizerStats(userId, {
      rank: currentRank > 0 ? currentRank : undefined,
    });
  }

  async getOrganizerRating(
    userId: number,
  ): Promise<OrganizerRatingResponse | null> {
    const stats =
      await this.ratingsDataService.getOrganizerStatsWithUser(userId);
    if (!stats || !stats.user) {
      return null;
    }

    return {
      userId: stats.userId,
      nickName: stats.user.nickName,
      logoUrl: stats.user.logoUrl || undefined,
      gamesOrganized: stats.gamesOrganized,
      totalPoints: stats.totalPoints,
      averagePoints: stats.averagePoints?.toNumber(),
      rank: stats.rank ?? undefined,
    };
  }

  async getOrganizerLeaderboard(
    sortBy: string = 'totalPoints',
    order: 'asc' | 'desc' = 'desc',
    limit: number = 50,
    offset: number = 0,
    searchQuery?: string,
  ) {
    const { items, total } =
      await this.ratingsDataService.getOrganizerLeaderboard(
        sortBy,
        order,
        limit,
        offset,
        searchQuery,
      );

    const ratings: OrganizerRatingResponse[] = items
      .filter((item) => item.user)
      .map((item) => ({
        userId: item.userId,
        nickName: item.user.nickName,
        logoUrl: item.user.logoUrl || undefined,
        gamesOrganized: item.gamesOrganized,
        totalPoints: item.totalPoints,
        averagePoints: item.averagePoints?.toNumber(),
        rank: item.rank ?? undefined,
      }));

    return {
      items: ratings,
      total,
      limit,
      offset,
    };
  }
}
