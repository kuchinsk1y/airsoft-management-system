import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { TeamInvitationResponse, TeamsResponse } from '../interfaces';
import { TeamsMemberResponseDto } from './teams-member-response.dto';

export class TeamsResponseDto
  extends BaseResponseDto<TeamsResponse>
  implements TeamsResponse
{
  id: number;
  name: string;
  logoUrl: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  members?: TeamsMemberResponseDto[];
  invitations?: TeamInvitationResponse[];

  constructor(data: TeamsResponse) {
    super(data);
    this.id = data.id;
    this.name = data.name;
    this.logoUrl = data.logoUrl ?? null;
    this.description = data.description ?? null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.members) {
      this.members = data.members.map(
        (member) => new TeamsMemberResponseDto(member),
      );
    }
    if (data.invitations) {
      this.invitations = data.invitations;
    }
  }
}
