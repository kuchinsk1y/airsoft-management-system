import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
import { EmailRequest } from '../interfaces';

export class EmailRequestDto implements EmailRequest {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  body: string;

  @IsObject()
  metadata: {
    frontendUrl?: string;
    type?: string;
    subject: string;
    template?: string;
    [key: string]: string | number | boolean | undefined;
  };
}
