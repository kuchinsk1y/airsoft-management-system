import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { TeamsMemberResponse } from '../interfaces';

export class TeamsMemberResponseDto
  extends BaseResponseDto<TeamsMemberResponse>
  implements TeamsMemberResponse
{
  id: number;
  teamId: number;
  userId: number;
  memberStatus: TeamsMemberResponse['memberStatus'];
  joinedAt: Date | null;
  leftAt: Date | null;
  teamContribution: number;
  role?: string;
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

  constructor(data: TeamsMemberResponse) {
    super(data);
    this.id = data.id;
    this.teamId = data.teamId;
    this.userId = data.userId;
    this.memberStatus = data.memberStatus;
    this.joinedAt = data.joinedAt ?? null;
    this.leftAt = data.leftAt ?? null;
    this.teamContribution = data.teamContribution;
    this.role = data.role;
    this.user = data.user;
    if (data.playerStats) {
      this.playerStats = data.playerStats;
    }
  }
}
