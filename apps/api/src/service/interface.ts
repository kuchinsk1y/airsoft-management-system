import { ServiceOrderStatus } from '../generated/prisma-client';

export interface CreateServiceOrder {
  name: string;
  phoneNumber: string;
  email: string;
  message: string;
  topic: string;
  company?: string;
}

export interface ServiceFilter {
  status?: ServiceOrderStatus;
  searchQuery?: string;
}
