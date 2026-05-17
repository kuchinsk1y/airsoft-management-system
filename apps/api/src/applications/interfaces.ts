export interface ApplicationRequest {
  name: string;
  address: string;
  phoneNumber?: string;
  description?: string;
  logoUrl?: string;
}

export interface ApplicationResponse {
  id: number;
  uid: string;
  name: string;
  address?: string | null;
  phoneNumber?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}
