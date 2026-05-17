import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRatingGameTypeDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsInt()
  @Min(0)
  playerPoints: number;

  @IsInt()
  @Min(0)
  teamWinPoints: number;

  @IsInt()
  @Min(0)
  teamParticipatedPoints: number;

  @IsInt()
  @Min(0)
  organizerPointsPerParticipant: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
