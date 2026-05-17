import {
  CompetitionType,
  EventRegistrationStatus,
  EventStatus,
  PaymentMethod,
} from '../generated/prisma-client';

export interface EventSideResponse {
  id: number;
  name: string;
  orderIndex: number;
  teamId?: number | null;
  team?: { id: number; name: string };
  sideCapacity: number;
  playersCount: number;
}

export type EventSocialLinks = Record<string, string>;

export interface EventsRequest {
  name: string;
  image: string;
  startDate: Date | string;
  gameStartDate: Date | string;
  endDate: Date | string;
  description?: string;
  city: string;
  regionId?: number;
  address?: string;
  applicationId: number;
  maxParticipants?: number;
  competitionType: CompetitionType;
  gameTypeId: number;
  paymentMethods: PaymentMethod[];
  price: number;
  isActive?: boolean;
  sides: Array<{ name: string; sideCapacity: number }>;
  socialLinks?: EventSocialLinks;
}

export interface EventsResponse {
  id: number;
  name: string;
  image: string;
  startDate: Date;
  gameStartDate: Date;
  endDate?: Date;
  description?: string;
  city: {
    id: number;
    name: string;
    slug: string;
    region: {
      id: number;
      name: string;
      slug: string;
    };
  };
  address: string;
  applicationId: number;
  application: {
    id: number;
    uid: string;
    name: string;
    phoneNumber?: string | null;
    owner: {
      id: number;
      fullName: string | null;
      nickName: string;
    };
  };
  maxParticipants: number;
  registeredParticipants: number;
  competitionType: CompetitionType;
  gameTypeId: number;
  gameType: {
    id: number;
    name: string;
  };
  paymentMethods: PaymentMethod[];
  price: number;
  isActive: boolean;
  isCompleted?: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  sides?: EventSideResponse[];
  socialLinks?: EventSocialLinks;
  status: EventStatus;
  statusReason?: string | null;
}

export interface EventsFilters {
  applicationId?: number;
  isActive?: boolean;
  competitionType?: CompetitionType;
  citySlug?: string;
  city?: string;
  regionSlug?: string;
  searchQuery?: string;
  date?: string;
  month?: string;
  status?: EventStatus;
}

export interface EventUpdateRequest {
  name?: string;
  image?: string;
  description?: string;
  address?: string;
  maxParticipants?: number;
  competitionType?: CompetitionType;
  gameTypeId?: number;
  paymentMethods?: PaymentMethod[];
  price?: number;
  isActive?: boolean;
  city?: string;
  regionId?: number;
  startDate?: Date | string;
  gameStartDate?: Date | string;
  endDate?: Date | string;
  sides?: Array<{ name: string; sideCapacity: number }>;
  socialLinks?: EventSocialLinks;
}

export interface EventStatusRequest {
  status: EventStatus;
  reason?: string;
}

export interface EventRegistrationRequest {
  teamId?: number | null;
  orderId: number;
  eventSideId?: number | null;
}

export interface EventRegistrationUpdateRequest {
  status?: EventRegistrationStatus;
  teamId?: number | null;
  orderId?: number | null;
  eventSideId?: number | null;
}

export interface EventRegistrationWithRelations {
  id: number;
  userId: number;
  teamId: number | null;
  status: EventRegistrationStatus;
  user: {
    id: number;
    fullName: string | null;
    nickName: string;
    logoUrl: string | null;
  };
  team: {
    id: number;
    name: string;
    logoUrl: string | null;
  } | null;
  createdAt: Date;
}

export interface EventRegistrationWithEvent {
  id: number;
  userId: number;
  eventId: number;
  teamId: number | null;
  status: EventRegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: number;
    name: string;
    isActive: boolean;
    startDate: Date;
    gameStartDate: Date;
    competitionType: CompetitionType;
    status: EventStatus;
    statusReason?: string | null;
  } | null;
}

export interface EventRegistrationForReminder {
  id: number;
  userId: number;
  eventId: number;
  teamId: number | null;
  status: EventRegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: number;
    name: string;
    startDate: Date;
    gameStartDate: Date;
  } | null;
}

export interface EventGalleryItem {
  id: number;
  eventId: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}
