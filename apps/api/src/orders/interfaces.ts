import {
  EventRegistrationStatus,
  OrderStatus,
} from '../generated/prisma-client';

export { OrderStatus };

export interface OrderProductRequest {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderEventRequest {
  eventId: number;
  eventSideId?: number | null;
  price: number;
  teamId?: number;
  selectedMemberIds?: number[];
}

export interface OrderRequest {
  products?: OrderProductRequest[];
  events?: OrderEventRequest[];
  paymentMethod: 'BANK' | 'CASH';
}

export interface OrderProductResponse {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
    price: number;
  };
}

export interface OrderEventResponse {
  id: number;
  eventId: number;
  status: EventRegistrationStatus;
  event: {
    id: number;
    name: string;
    image: string;
    price: number;
    startDate: Date;
    application: {
      id: number;
      name: string;
    };
  };
}

export interface OrderResponse {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'BANK' | 'CASH';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    email: string;
    fullName: string | null;
    nickName: string;
    phoneNumber: string | null;
  };
  products: OrderProductResponse[];
  events: OrderEventResponse[];
}

export type OrderType = 'products' | 'events' | 'all';

export interface OrdersFilters {
  userId?: number;
  applicationId?: number;
  eventId?: number;
  status?: OrderStatus;
  searchQuery?: string;
  orderType?: OrderType;
}
