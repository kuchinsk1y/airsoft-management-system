import { Provider } from '../generated/prisma-client';

export interface RegisterRequest {
  email: string;
  fullName: string;
  nickName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  country: string;
  region: string;
  city: string;
  userAgreement: boolean;
  ageConfirmation: boolean;
  frontendUrl: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface OAuthLoginRequest {
  provider: Provider;
  providerId: string;
  email: string;
  givenName?: string | null;
  familyName?: string | null;
}
