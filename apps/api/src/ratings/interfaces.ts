import {
  EventPlacement,
  EventResultStatus,
  RatingOutcome,
} from '../generated/prisma-client';

export interface EventResultRequest {
  eventId: number;
  userId?: number;
  teamId?: number;
  placement: EventPlacement;
  points?: number;
  kills?: number;
  deaths?: number;
  accuracy?: number;
}

export interface EventResultResponse {
  id: number;
  eventId: number;
  userId?: number;
  teamId?: number;
  sideId?: number;
  outcome?: RatingOutcome;
  placement: EventPlacement;
  points: number;
  kills?: number;
  deaths?: number;
  accuracy?: number;
  status: EventResultStatus;
  confirmedAt?: Date;
  confirmedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: number;
    name: string;
    competitionType: string;
  };
  user?: {
    id: number;
    nickName: string;
    logoUrl?: string;
  };
  team?: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  side?: {
    id: number;
    name: string;
  };
}

export interface PlayerRatingResponse {
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
}

export interface TeamRatingResponse {
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
}

export interface OrganizerRatingResponse {
  userId: number;
  nickName: string;
  logoUrl?: string;
  gamesOrganized: number;
  totalPoints: number;
  averagePoints?: number;
  rank?: number;
}

export interface EventRatingOutcomeRequest {
  sideId?: number;
  teamId?: number;
  outcome: 'WIN' | 'PARTICIPATED';
}

export interface CompleteEventWithRatingsRequest {
  actualParticipants: number;
  outcomes: EventRatingOutcomeRequest[];
}

export interface LeaderboardQuery {
  limit?: number;
  offset?: number;
  sortBy?: 'points' | 'totalPoints' | 'rank' | 'winRate';
  order?: 'asc' | 'desc';
}

export interface LeaderboardResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
