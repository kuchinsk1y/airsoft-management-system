import { Provider } from '../generated/prisma-client';

export { Provider };

export interface UsersRequest {
  email: string;
  fullName: string;
  nickName: string;
  phoneNumber?: string;
  password: string | null;
  dateOfBirth: Date;
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

export interface OAuthUsersRequest {
  provider: Provider;
  providerId: string;
}

export interface UsersResponse {
  id: number;
  email: string;
  fullName: string | null;
  nickName: string;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  country: string | null;
  region: string | null;
  city: string | null;
  logoUrl?: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthUsersResponse extends UsersResponse {
  provider: Provider;
  providerId: string;
}
