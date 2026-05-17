import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class LeaderboardQueryDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsInt()
  @IsOptional()
  @Min(0)
  offset?: number = 0;

  @IsEnum(['points', 'totalPoints', 'rank', 'winRate'])
  @IsOptional()
  sortBy?: 'points' | 'totalPoints' | 'rank' | 'winRate' = 'totalPoints';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc' = 'desc';
}
