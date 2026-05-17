import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { UsersResponse } from '../interfaces';

export class UsersResponseDto
  extends BaseResponseDto<UsersResponse>
  implements UsersResponse
{
  id: number;
  email: string;
  fullName: string | null;
  nickName: string;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  region: string | null;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: UsersResponse) {
    super(data);
    this.id = data.id;
    this.email = data.email;
    this.fullName = data.fullName;
    this.nickName = data.nickName;
    this.phoneNumber = data.phoneNumber;
    this.dateOfBirth = data.dateOfBirth;
    this.country = data.country;
    this.region = data.region;
    this.city = data.city;
    this.logoUrl = data.logoUrl ?? null;
    this.isVerified = data.isVerified;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
