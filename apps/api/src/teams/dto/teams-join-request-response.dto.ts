import { BaseResponseDto } from '../../common/dto/base-response.dto';
import {
  TeamsJoinRequestResponse,
  TeamsJoinRequestStatus,
} from '../interfaces';

export class TeamsJoinRequestResponseDto
  extends BaseResponseDto<TeamsJoinRequestResponse>
  implements TeamsJoinRequestResponse
{
  id: number;
  teamId: number;
  userId: number;
  status: TeamsJoinRequestStatus;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  user: {
    id: number;
    nickName: string;
    logoUrl: string | null;
  };
  playerStats?: {
    gamesPlayed: number;
    wins: number;
    points: number;
    accuracy: number | null;
    kdRatio: number | null;
    rank: number | null;
  };

  constructor(data: TeamsJoinRequestResponse) {
    super(data);
    this.id = data.id;
    this.teamId = data.teamId;
    this.userId = data.userId;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.reviewedAt = data.reviewedAt ?? null;
    this.reviewedBy = data.reviewedBy ?? null;
    this.user = data.user;
    if (data.playerStats) {
      this.playerStats = data.playerStats;
    }
  }
}
