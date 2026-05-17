import { IsInt } from "class-validator";


export class TeamTransferOwnershipsRequestDto {

  @IsInt()
  newOwnerId!: number;

  @IsInt()
  expiresInMinutes?: number;
}