import { BaseResponseDto } from '../../common/dto/base-response.dto';
import {
  CompetitionType,
  EventStatus,
  PaymentMethod,
} from '../../generated/prisma-client';
import {
  EventSideResponse,
  EventSocialLinks,
  EventsResponse,
} from '../interfaces';

export class EventsResponseDto
  extends BaseResponseDto<EventsResponse>
  implements EventsResponse
{
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
