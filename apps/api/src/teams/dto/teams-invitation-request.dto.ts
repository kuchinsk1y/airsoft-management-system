import { IsInt, IsOptional, Min } from 'class-validator';
import { TeamsInvitationRequest } from '../interfaces';

export class TeamsInvitationRequestDto implements TeamsInvitationRequest {
  @IsInt()
  @IsOptional()
  @Min(1)
  teamId: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  inviterId: number;

  @IsInt()
  @Min(1)
  inviteeId: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  expiresInDays?: number;
}
