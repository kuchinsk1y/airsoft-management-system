import {
  IsEmail,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinkInputDto {
  @IsString({ message: 'Вкажіть назву соціальної мережі текстом.' })
  @IsNotEmpty({ message: 'Назва соціальної мережі не може бути порожньою.' })
  provider: string;

  @IsNotEmpty({ message: 'Вкажіть посилання на соціальну мережу.' })
  @ValidateIf((o) => o.provider === 'phone')
  @Matches(/^\+380\d{9}$/, {
    message:
      'Для телефону вкажіть номер у форматі +380XXXXXXXXX (тільки цифри після +380).',
  })
  @ValidateIf((o) => o.provider === 'email')
  @IsEmail(
    {},
    {
      message:
        'Для email вкажіть коректну адресу, наприклад mail@example.com.',
    },
  )
  @ValidateIf((o) => o.provider !== 'phone' && o.provider !== 'email')
  @IsUrl(
    {
      require_protocol: true,
    },
    {
      message:
        'Посилання на соціальну мережу має бути коректною URL-адресою, наприклад https://instagram.com/your-page.',
    },
  )
  url: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString({ message: 'Назва компанії має бути текстом.' })
  companyName?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    {
      message:
        'URL логотипу має бути коректним посиланням, наприклад https://example.com/logo.png.',
    },
  )
  logoUrl?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    {
      message:
        'Адреса сайту має бути коректним посиланням, наприклад https://example.com.',
    },
  )
  websiteUrl?: string;

  @IsOptional()
  @IsString({ message: 'Телефон має бути текстом.' })
  phone?: string;

  @IsOptional()
  @IsBoolean({ message: 'Прапорець SMS має бути true або false.' })
  registrationSmsEnabled?: boolean;

  @IsOptional()
  @IsArray({ message: 'Соціальні мережі мають бути списком.' })
  @ValidateNested({ each: true })
  @Type(() => SocialLinkInputDto)
  socialLinks?: SocialLinkInputDto[];
}
