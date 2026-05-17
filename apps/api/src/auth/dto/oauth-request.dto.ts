import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Provider } from '../../generated/prisma-client';
import { OAuthLoginRequest } from '../interfaces';

export class OAuthRequestDto implements OAuthLoginRequest {
  @IsNotEmpty()
  @IsEnum(Provider)
  provider: Provider;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  givenName?: string | null;

  @IsString()
  @IsOptional()
  familyName?: string | null;
}
