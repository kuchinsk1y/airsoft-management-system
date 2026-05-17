import { PlayerRatingResponse } from '../interfaces';

export class PlayerRatingResponseDto implements PlayerRatingResponse {
  userId: number;
  nickName: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  totalPoints: number;
  averagePoints?: number;
  accuracy?: number;
  kdRatio?: number;
  winRate?: number;
  rank?: number;
  previousRank?: number;

  constructor(data: PlayerRatingResponse) {
    this.userId = data.userId;
    this.nickName = data.nickName;
    this.logoUrl = data.logoUrl;
    this.gamesPlayed = data.gamesPlayed;
    this.wins = data.wins;
    this.losses = data.losses;
    this.draws = data.draws;
    this.points = data.points;
    this.totalPoints = data.totalPoints;
    this.averagePoints = data.averagePoints;
    this.accuracy = data.accuracy;
    this.kdRatio = data.kdRatio;
    this.winRate = data.winRate;
    this.rank = data.rank;
    this.previousRank = data.previousRank;
  }
}
