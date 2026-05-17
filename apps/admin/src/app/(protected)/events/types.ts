export type CompetitionType = 'Командне' | 'Індивідуальне' | 'Тренувальне'
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface EventSideForm {
  name: string
  sideCapacity: number
}

export type PaymentMethodOption = 'BANK' | 'CASH'

export type EventSocialLinks = Record<string, string>

export interface EventFormData {
  name: string
  image: string
  startDate: Date
  gameStartDate: Date
  endDate: Date
  description?: string
  city: string
  regionId: number
  address: string
  maxParticipants: number
  competitionType: CompetitionType
  gameTypeId: number
  price: number
  paymentMethods: PaymentMethodOption[]
  isActive?: boolean
  applicationId?: number
  sides: EventSideForm[]
  socialLinks?: EventSocialLinks
}

export interface EventSide {
  id: number
  name: string
  orderIndex?: number
  sideCapacity: number
  playersCount?: number
}

export interface EventGalleryItem {
  id: number
  url: string
  createdAt: Date
}

export interface Event {
  id: number
  name: string
  image: string
  startDate: Date
  gameStartDate: Date
  endDate?: Date
  description?: string
  city: {
    id: number
    name: string
    slug: string
    region?: {
      id: number
      name: string
      slug: string
    }
  }
  address: string
  applicationId: number
  application: {
    id: number
    uid: string
    name: string
    phoneNumber?: string | null
    owner: {
      id: number
      fullName: string | null
      nickName: string
    }
  }
  maxParticipants: number
  registeredParticipants: number
  competitionType: CompetitionType
  gameTypeId: number
  gameType?: {
    id: number
    name: string
  }
  price: number
  paymentMethods?: ('BANK' | 'CASH')[]
  isActive: boolean
  isCompleted?: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  status: EventStatus
  statusReason?: string
  sides?: EventSide[]
  socialLinks?: EventSocialLinks
}
