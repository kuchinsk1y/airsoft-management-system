import * as React from 'react';
import { ReactNode } from 'react';
import { z } from 'zod';
import type { UserEquipmentItem } from './constants/equipment';

export type ArchiveFilterValue = string | null;

export interface ArchiveFilterOption<
  TValue extends ArchiveFilterValue = ArchiveFilterValue,
> {
  key: string;
  value: TValue;
  label: string;
  itemClassName?: string;
}

export interface ArchiveLabeledOption<
  TValue extends ArchiveFilterValue = ArchiveFilterValue,
> {
  value: TValue;
  label: string;
}

export interface ArchiveFilterDropdownProps<
  TValue extends ArchiveFilterValue = ArchiveFilterValue,
> {
  containerClassName: string;
  contentClassName: string;
  contentAlign: 'start' | 'end';
  selectedValue: TValue;
  displayLabel: string;
  options: Array<ArchiveFilterOption<TValue>>;
  onSelect: (value: TValue) => void;
}

export interface FormField {
  name: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'checkbox' | 'calendar';
  required?: boolean;
  checkboxDescription?: string | React.ReactNode;
}

export interface BaseFormProps<T extends z.ZodObject<z.ZodRawShape>> {
  title: string;
  schema: T;
  fields: FormField[];
  submitText: string;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  bypassValidation?: boolean;
  topRightLink?: {
    text: string;
    href: string;
    alwaysVisible?: boolean;
  };
  bottomLink?: {
    text: string;
    href: string;
    className?: string;
  };
  successContent?: ReactNode;
  getLocalizedError?: (error: string) => string;
  className?: string;
  additionalMessage?: string;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  nickName: string;
  phoneNumber: string | null;
  dateOfBirth: Date;
  country: string;
  region: string;
  city: string;
  logoUrl: string;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface UserUpdateFieldConfig {
  id: string;
  label: string;
  helperText?: string;
}

export interface ProfileLinks {
  title: string;
  href: string;
}

export interface EquipmentModalProps {
  equipment: UserEquipmentItem[];
  onClose: () => void;
  onSaved?: () => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?:
    | 'white-border'
    | 'white-bg'
    | 'orange-bg'
    | 'gray-bg'
    | 'google'
    | 'facebook';
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}
export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  filled?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'form' | 'search' | 'newsletter';
  className?: string;
}

export interface CalendarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  textStyle?: string;
}

export interface TemplateData<T = unknown> {
  title?: string;
  subtitle?: string;
  content?: T;
}

export interface ContactCardProps {
  city: string;
  phones: string[];
  address: string;
  mapUrl: string;
  cityHref?: string;
}

export interface ContactItem {
  id: number;
  city: string;
  phones: string[];
  address: string;
  mapUrl: string;
  cityHref?: string;
}

export interface RulePoint {
  id: number;
  text?: string;
  marklist?: string[];
  numberlist?: string[];
}

export interface RuleSubsection {
  id: number;
  subtitle?: string;
  points: RulePoint[];
}

export interface RuleSection {
  id: number;
  text?: string;
  numberlist?: string[];
  marklist?: string[] | string;
}

export interface RuleItem {
  id: number;
  title: string;
  sections?: RuleSection[];
  subsections?: RuleSubsection[];
}

export interface HeaderMobileNavProps {
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export interface PhoneDropdownProps {
  inline?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface TitleBlockProps {
  path: string[] | BreadcrumbItem[];
  title: string;
  subtitle?: string;
  className?: string;
  breadcrumbClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
}

export interface UserDropdownProps {
  fullName: string;
  className?: string;
}

export interface VerifyPageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export interface UserContextType {
  user: User | null;
  isLoading: boolean;
  loadUser: () => Promise<User | null>;
  handleLogout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export enum DealType {
  RENT = 'RENT',
  SALE = 'SALE',
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  isActive: boolean;
  dealType: DealType;
  cityId?: number;
  city?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsFilters {
  cityId?: number;
  citySlug?: string;
  city?: string;
  regionSlug?: string;
  dealType?: DealType;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price-low' | 'price-high' | 'name' | 'recommended';
  isActive?: boolean;
}

export type ProductCategory = 'ВСІ ТОВАРИ' | 'ОРЕНДА' | 'КУПІВЛЯ';

export type CategoryOption = {
  category: ProductCategory;
  dealType: DealType | null;
};

export interface RentalPageProps {
  initialProducts: Product[];
  template?: {
    title?: string;
    breadcrumbs: string[];
    seoText?: string;
    seoFaq?: FaqItem[];
  };
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  variant?: 'default' | 'cart';
  regionSlug?: string;
  hideDescription?: boolean;
  forceDetailsButton?: boolean;
}

export interface FilterContentProps {
  category: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  maxAvailablePrice: number;
}
export interface ProductsFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  maxAvailablePrice: number;
}
export interface ProductsSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: ProductsFilters['sortBy'];
  onSortChange: (value: ProductsFilters['sortBy']) => void;
  onFiltersClick?: () => void;
}

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export interface ProductPageProps {
  product: Product;
  template?: {
    breadcrumbs: string[];
  };
  shareUrl?: string;
}

export interface EventPageProps {
  event: Event;
  template?: {
    breadcrumbs: string[];
  };
  region?: string;
  gallery?: EventGalleryItem[];
  isAlreadyRegistered?: boolean;
}

export interface ShareLink {
  href: string;
  ariaLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  rel?: string;
}

export interface CartItem {
  id: string;
  productId?: number;
  product?: Product;
  eventId?: number;
  eventSideId?: number;
  teamId?: number;
  event?: Event;
  quantity: number;
  price: number;
}

export interface CartState {
  userId: number | null;
  items: CartItem[];
  isOpen: boolean;
}

export interface CartStore {
  userId: number | null;
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  switchCartUser: (userId: number | null) => void;
  addItem: (product: Product, quantity?: number) => void;
  addEvent: (event: Event, eventSideId?: number) => void;
  setEventSide: (itemId: string, eventSideId: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export type PaymentMethod = 'BANK' | 'CASH';

export interface CheckoutEventInfo {
  id: number;
  name: string;
  image: string;
  startDate: Date | string;
  gameStartDate?: Date | string;
  city?: { name: string };
  address?: string;
  sides?: { id: number; name: string }[];
}

export interface CheckoutFirstEventItem {
  id: string;
  eventSideId?: number;
}

export interface CheckoutTeam {
  id: number;
  name: string;
}

export interface HeroContent {
  type: string;
  image?: string;
}
export interface FaqItem {
  question: string;
  answer: string;
}

export interface City {
  id: number;
  name: string;
  slug: string;
  regionId?: number;
  region?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt?: Date | string;
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
}

export type CompetitionType = 'TEAM' | 'INDIVIDUAL' | 'TRAINING';

export interface EventsRequest {
  name: string;
  image: string;
  startDate: Date | string;
  gameStartDate?: Date | string;
  endDate?: Date | string;
  description?: string;
  city: string;
  regionId?: number;
  address: string;
  organizerId: number;
  maxParticipants: number;
  registeredParticipants?: number;
  competitionType: CompetitionType;
  gameTypeId: number;
  price: number;
  isActive?: boolean;
}

export interface EventSide {
  id: number;
  name: string;
  orderIndex?: number;
  sideCapacity: number;
  playersCount?: number;
}

export interface EventGalleryItem {
  id: number;
  url: string;
  createdAt: Date | string;
}

export interface Event {
  id: number;
  name: string;
  image: string;
  startDate: Date | string;
  gameStartDate?: Date | string;
  endDate?: Date | string;
  description?: string;
  winnerTeamName?: string;
  difficulty?: string;
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
      fullName: string | null;
      nickName: string;
    };
  };
  maxParticipants: number;
  registeredParticipants: number;
  competitionType: CompetitionType;
  gameTypeId: number;
  gameType?: {
    id: number;
    name: string;
  };
  price: number;
  paymentMethods?: ('BANK' | 'CASH')[];
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  sides?: EventSide[];
  socialLinks?: Record<string, string>;
}

export interface EventsFilters {
  regionSlug?: string;
  city?: string;
  citySlug?: string;
  competitionType?: string;
  isActive?: boolean;
  searchQuery?: string;
  date?: string;
  month?: string;
}

export interface EventsPageProps {
  searchParams: Promise<{
    region?: string;
    isActive?: string;
    competitionType?: string;
    searchQuery?: string;
    date?: string;
  }>;
}

export interface EventsCalendarPageProps {
  initialEvents: Event[];
  template?: {
    title?: string;
    breadcrumbs?: string[];
    seoText?: string;
    seoFaq?: FaqItem[];
  };
}

export interface EventCardProps {
  hideBorderOn1440?: boolean;
  event: Event;
  regionSlug?: string;
}

export interface EventDetailsSectionProps {
  event: Event;
}

export interface EventsCalendarProps {
  containerStyle?: string;
  dateItemsStyle?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  reverse?: boolean;
}

export interface EventsSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCompetitionType: CompetitionType | null;
  onCompetitionTypeChange: (type: CompetitionType | null) => void;
  archiveButtonText?: string;
  archiveButtonUrl?: string;
}

export interface PaginationProps {
  hasMoreItems?: boolean;
  totalPages: number;
  currentPage: number;
  onShowMore?: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  showMoreText?: string;
  className?: string;
  paginationClassName?: string;
  title?: string;
  titleClassName?: string;
}

export interface BannerData {
  title: string;
  description?: string;
  backgroundImage?: string;
  image?: string;
}

export interface BannerProps {
  className?: string;
  pageKey?: string;
  region?: string;
}

export interface ArrowSectionProps {
  title: string;
  current?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
  isPrevDisabled?: boolean;
  isNextDisabled?: boolean;
  showArrows?: boolean;
  onClick?: () => void;
}

export interface EquipmentRentalBlockProps {
  products: Product[];
  title?: string;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  className?: string;
}

export interface TopCardProps {
  title: string;
  data: DataTopCardProps[];
}

export interface PaginationTeamListProps {
  className?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface RatingGenericPageProps {
  title: string;
  placeholder?: string;
  path?: { label: string; href?: string }[] | BreadcrumbItem[];
}

export interface EventResultResponse {
  id: number;
  eventId: number;
  userId?: number;
  teamId?: number;
  sideId?: number;
  outcome?: 'WIN' | 'PARTICIPATED';
  placement: string;
  points: number;
  kills?: number;
  deaths?: number;
  accuracy?: number;
  status: string;
  confirmedAt?: string;
  confirmedBy?: number;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: number;
    name: string;
    competitionType: string;
  };
  user?: {
    id: number;
    nickName: string;
    logoUrl?: string;
  };
  team?: {
    id: number;
    name: string;
    logoUrl?: string;
  };
  side?: {
    id: number;
    name: string;
  };
}

export interface PlayerRatingResponse {
  userId: number;
  nickName: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  totalPoints: number;
  averagePoints?: number;
  accuracy?: number;
  kdRatio?: number;
  winRate?: number;
  rank?: number;
  previousRank?: number;
}

export interface TeamRatingResponse {
  teamId: number;
  name: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  totalPoints: number;
  averagePoints?: number;
  winRate?: number;
  rank?: number;
  membersCount: number;
}

export interface OrganizerRatingResponse {
  userId: number;
  nickName: string;
  logoUrl?: string;
  gamesOrganized: number;
  totalPoints: number;
  averagePoints?: number;
  rank?: number;
}

export interface LeaderboardQuery {
  limit?: number;
  offset?: number;
  sortBy?: 'points' | 'totalPoints' | 'rank' | 'winRate';
  order?: 'asc' | 'desc';
  searchQuery?: string;
}

export interface LeaderboardResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type RatingType = 'players' | 'teams' | 'organizers';

export interface RatingTableRow {
  id: number;
  logoUrl: string;
  nickName?: string;
  teamName?: string;
  description?: string;
  gamesPlayed?: number;
  wins?: number;
  winRate?: number;
  membersCount?: number;
  points?: number;
  totalPoints?: number;
  averagePoints?: number;
  rank?: number;
  rating?: number;
}

export interface DataTopCardProps {
  logoUrl: string;
  nickName: string;
  score: number;
}

export interface ResRatingProps {
  data: PlayerRatingResponse[];
  meta: {
    total: number;
    page: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface OnInputProps {
  onResults: (value: string) => void;
  placeholder: string;
  className?: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface TimeUntilEvent {
  label: string;
  time: string;
}

export interface FeedbackCardProps {
  logoUrl: string;
  name: string;
  nickName: string;
  progress: string;
  text: string;
  withBorder?: boolean;
}

export interface Partner {
  id: number;
  logo: string;
  link: string;
  alt: string;
}

export interface PartnerCardProps {
  partner: Partner;
}

export interface QuestionItemProps {
  id: number;
  question: string;
  answer: string;
}

export interface UserUpdateFieldConfig {
  id: string;
  label: string;
  helperText?: string;
}

export interface ProfileLinks {
  title: string;
  href: string;
}

export interface CheckoutResponse {
  orderId: number;
  paymentMethod: 'BANK' | 'CASH';
  data?: string;
  signature?: string;
}

export type OrderStatus =
  | 'NEW'
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_ON_SITE'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export type EventRegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface OrderProduct {
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

export interface OrderEvent {
  id: number;
  eventId: number;
  status: EventRegistrationStatus;
  event: {
    id: number;
    name: string;
    image: string;
    price: number;
    startDate: Date | string;
    application: {
      id: number;
      name: string;
    };
  };
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'BANK' | 'CASH';
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    id: number;
    email: string;
    fullName: string | null;
    nickName: string;
    phoneNumber: string | null;
  };
  products: OrderProduct[];
  events: OrderEvent[];
}

export interface OrdersFilters {
  userId?: number;
  applicationId?: number;
  status?: OrderStatus;
  searchQuery?: string;
  orderType?: 'products' | 'events' | 'all';
}

export interface Comment {
  id: number;
  eventId?: number;
  scope: 'EVENT' | 'COMPANY';
  userId: number;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date | string;
  moderatedAt?: Date | string;
  author: {
    id: number;
    nickName: string;
    fullName?: string;
    logoUrl?: string;
  };
  event?: {
    id: number;
    name: string;
  };
  moderator?: {
    id: number;
    nickName: string;
    fullName?: string;
  };
}

export type TeamTab = 'create' | 'join' | 'my-team' | 'applications' | 'edit';

export interface TeamHeaderProps {
  logoSrc: string;
  onLogoPick?: (file: File) => void;
  changeLogoText?: string;
  name?: string;
  description?: string;
  rightAction?: ReactNode;
}

export interface FormTextareaProps {
  placeholder: string;
  className?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export interface FieldTitleProps {
  children: ReactNode;
}

export interface TeamTabsProps {
  value: TeamTab;
  onChange: (value: TeamTab) => void;
  userRole?: 'none' | 'owner' | 'member';
}

export interface MyTeamEmptyStateProps {
  onCreated?: () => void;
}
export interface ItemTeamProps {
  id: number;
  rating: number;
  name: string;
  teamMember: number;
  logoUrl: string;
}

export interface TeamListItemProps {
  item: ItemTeamProps;
  onClick?: () => void;
  onOpenModal: () => void;
  onJoinError?: (message: string | null) => void;
}

export interface BackdropModalProps {
  icon?: React.ComponentType<{ className?: string }>;
  textStyle?: string;
  text?: string;
  children?: React.ReactNode;
}

export type NotificationItem = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type TeamRole = 'owner' | 'assistant' | 'staff' | 'member' | null;

export type CreateTeamPayload = {
  name: string;
  description?: string;
  logoUrl?: string;
};

export type TeamMember = {
  id?: number | string;
  role?: 'owner' | 'assistant' | 'staff' | 'member' | null;
  nickName?: string;
  logoUrl?: string;
  games?: number;
  points?: number;
  rating?: number | string;
  contribution?: number;
};

export type TeamDetailsResponse = {
  id: number;
  name: string;
  logoUrl?: string;
  description?: string;
  members?: Array<{
    id: number;
    role?: string;
    teamContribution?: number;
    user?: {
      id: number;
      nickName: string;
      logoUrl?: string;
      playerStats?: {
        gamesPlayed?: number;
        points?: number;
        totalPoints?: number;
        rank?: number;
      };
    };
    playerStats?: {
      gamesPlayed?: number;
      points?: number;
      totalPoints?: number;
      rank?: number;
    };
  }>;
};

export interface Application {
  id: number;
  logoUrl: string;
  userName: string;
  rating: number;
  gamesPlayed: number;
  points: number;
  applicationDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface TeamApplicationsProps {
  teamId?: number;
}

export interface MobileApplicationItemProps {
  team: Application;
  onAccept: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export interface DesktopApplicationItemProps {
  team: Application;
  gridLayout: string;
  onAccept: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  isActive: boolean;
}
export interface MainBannerProps {
  banners: Banner[];
}

export interface WorkshopData {
  title: string;
  description: string;
  heroImage: string;
  content: WorkshopContentBlock[];
}

export interface WorkshopServicesBlock {
  type: 'services';
  title: string;
  items: WorkshopCardData[];
}

export interface WorkshopSupportBlock {
  type: 'support';
  title: string;
  items: WorkshopCardData[];
}

export interface WorkshopContactsBlock {
  type: 'contacts';
  title: string;
  address: string[];
  phone: string[];
  workingHours: string[];
}

export type WorkshopContentBlock =
  | WorkshopServicesBlock
  | WorkshopSupportBlock
  | WorkshopContactsBlock;

export interface WorkshopCardData {
  image: string;
  description: string;
  title: string;
  slug?: string;
}

export type WorkshopItemCategory = 'SERVICES' | 'SUPPORT';

export interface WorkshopItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: WorkshopItemCategory;
  published: boolean;
  publishedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: {
    id: number;
    nickName: string;
    fullName?: string;
    logoUrl?: string;
  };
  updatedBy?: {
    id: number;
    nickName: string;
    fullName?: string;
  };
}

export interface WorkshopItemListResponse {
  items: WorkshopItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface NewsPageProps {
  items: NewsItem[];
  total: number;
  currentPage: number;
  limit: number;
  searchQuery: string;
  title?: string;
  heroImage?: string;
  seoText?: string;
}

export interface PageProps {
  searchParams: Promise<{
    searchQuery?: string;
    offset?: string;
    category?: 'AIRSOFT' | 'STRIKESHOP';
  }>;
}

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  published: boolean;
  publishedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  author: {
    id: number;
    nickName: string;
    fullName?: string;
    logoUrl?: string;
  };
  updatedBy?: {
    id: number;
    nickName: string;
    fullName?: string;
  };
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface WorkshopFormProps {
  topic: string;
  fields: {
    label: string;
    name: string;
    placeholder?: string;
  }[];
}

export interface AboutContent {
  title: string;
  content: string;
}

export interface LegalContent {
  title: string;
  content: string;
}

export interface PaymentContent {
  title: string;
  content: string;
}
