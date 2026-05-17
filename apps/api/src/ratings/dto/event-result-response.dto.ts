import {
  EventPlacement,
  EventResultStatus,
  RatingOutcome,
} from '../../generated/prisma-client';
import { EventResultResponse } from '../interfaces';

export class EventResultResponseDto implements EventResultResponse {
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

  constructor(data: EventResultResponse) {
    this.id = data.id;
    this.eventId = data.eventId;
    this.userId = data.userId;
    this.teamId = data.teamId;
    this.sideId = data.sideId;
    this.outcome = data.outcome;
    this.placement = data.placement;
    this.points = data.points;
    this.kills = data.kills;
    this.deaths = data.deaths;
    this.accuracy = data.accuracy;
    this.status = data.status;
    this.confirmedAt = data.confirmedAt;
    this.confirmedBy = data.confirmedBy;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.event = data.event;
    this.user = data.user;
    this.team = data.team;
    this.side = data.side;
  }
}
