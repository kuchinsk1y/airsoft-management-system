import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { LoginRequest } from '../interfaces';

export class LoginRequestDto implements LoginRequest {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
