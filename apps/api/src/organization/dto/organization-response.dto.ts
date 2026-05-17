export class SocialLinkDto {
  provider: string; // 'instagram', 'telegram', 'facebook'.
  url: string;
}

export class OrganizationResponseDto {
  id: number;
  companyName: string;
  logoUrl?: string;
  websiteUrl?: string;
  phone?: string;
  registrationSmsEnabled: boolean;
  socialLinks: SocialLinkDto[];
  updatedAt: Date;
}
