import { IsEnum, IsOptional } from 'class-validator';
import { TeamsJoinRequestStatus } from '../interfaces';

export class TeamsJoinRequestUpdateDto {
  @IsOptional()
  @IsEnum(TeamsJoinRequestStatus)
  status?: TeamsJoinRequestStatus;
}
