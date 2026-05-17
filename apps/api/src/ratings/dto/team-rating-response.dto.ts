import { TeamRatingResponse } from '../interfaces';

export class TeamRatingResponseDto implements TeamRatingResponse {
  teamId: number;
  name: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  totalPoints: number;
  averagePoints?: number;
  winRate?: number;
  rank?: number;
  membersCount: number;

  constructor(data: TeamRatingResponse) {
    this.teamId = data.teamId;
    this.name = data.name;
    this.logoUrl = data.logoUrl;
    this.gamesPlayed = data.gamesPlayed;
    this.wins = data.wins;
    this.totalPoints = data.totalPoints;
    this.averagePoints = data.averagePoints;
    this.winRate = data.winRate;
    this.rank = data.rank;
    this.membersCount = data.membersCount;
  }
}
