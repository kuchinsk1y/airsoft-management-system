import { OrganizerRatingResponse } from '../interfaces';

export class OrganizerRatingResponseDto implements OrganizerRatingResponse {
  userId: number;
  nickName: string;
  logoUrl?: string;
  gamesOrganized: number;
  totalPoints: number;
  averagePoints?: number;
  rank?: number;

  constructor(data: OrganizerRatingResponse) {
    this.userId = data.userId;
    this.nickName = data.nickName;
    this.logoUrl = data.logoUrl;
    this.gamesOrganized = data.gamesOrganized;
    this.totalPoints = data.totalPoints;
    this.averagePoints = data.averagePoints;
    this.rank = data.rank;
  }
}
