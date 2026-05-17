import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EventRatingOutcomeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  sideId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamId?: number;

  @IsEnum(['WIN', 'PARTICIPATED'])
  outcome: 'WIN' | 'PARTICIPATED';
}

export class CompleteEventWithRatingsDto {
  @IsInt()
  @Min(0)
  actualParticipants: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EventRatingOutcomeDto)
  outcomes: EventRatingOutcomeDto[];
}
