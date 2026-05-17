import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentsDto {
  @IsOptional()
  @IsInt()
  eventId?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string;
}
