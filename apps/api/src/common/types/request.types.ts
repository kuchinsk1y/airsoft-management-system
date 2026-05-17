import { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  isAdmin?: boolean;
  userApplicationId?: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
