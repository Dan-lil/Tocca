export type ServerResponseType<T> = {
  statusCode: number;
  message: string;
  data: T | null;
  error: string | null;
};

export type CategoryType = {
  id: number;
  title: string;
  titleEn?: string | null;
  photo: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ServiziType = {
  id: number;
  masterId: number;
  masterName?: string | null;
  masterRating?: number;
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  price: number;
  duration: number;
  categoryId: number;
  isActive: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicMasterPortfolioItem = {
  id: string;
  imageUrl: string;
  title: string;
};

export type MasterSocialType = {
  id: number;
  userId: number;
  network: string;
  contact: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PublicMasterProfileType = {
  user: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
  profile: {
    id?: number;
    userId?: number;
    title?: string | null;
    titleEn?: string | null;
    description?: string | null;
    descriptionEn?: string | null;
    city?: string | null;
    address?: string | null;
    experience?: number | null;
    category?: string | null;
    categoryEn?: string | null;
    rating?: number | null;
  } | null;
  portfolio: PublicMasterPortfolioItem[];
  socials?: MasterSocialType[];
};

export type RecommendedMasterType = {
  id: number;
  name: string;
  title: string;
  titleEn?: string | null;
  avatar?: string | null;
  description?: string;
  descriptionEn?: string | null;
  city?: string;
  address?: string;
  rating: number;
  reviewCount: number;
  categoryIds: number[];
  categoryTitles: string[];
  categoryTitlesEn?: string[];
  services: Array<{
    id: number;
    title: string;
    titleEn?: string | null;
    price: number;
    duration: number;
    categoryId: number;
  }>;
  reason: string;
};

export type BookingModalPayload = {
  categoryId: number;
  categoryTitle: string;
  categoryTitleEn?: string | null;
  masterId: number;
  masterName?: string;
  services?: ServiziType[];
};

export type SaleType = {
  id: number;
  masterId: number;
  bookingId: number;
  serviziId: number;
  finalPrice?: number | null;
  discount: number;
  comment?: string | null;
  image?: string | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EcoReviewType = {
  id: number;
  masterId: number;
  clientId: number;
  bookingId: number;
  rating: number;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBookingPayload = {
  clientId: number;
  masterId: number;
  serviziId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  clientComment?: string;
};

export type BookingType = CreateBookingPayload & {
  id: number;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ShaduleType = {
  id: number;
  masterId: number;
  dayOdWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ChatUserType = {
  id: number;
  name: string;
  avatar?: string | null;
  role: "client" | "master" | "admin";
  ProfileMaster?: {
    title?: string | null;
    titleEn?: string | null;
    city?: string | null;
    category?: string | null;
    categoryEn?: string | null;
    rating?: number | null;
  } | null;
};

export type ChatMessageType = {
  id: number;
  chatId: number;
  senderId: number;
  text: string;
  sender?: ChatUserType;
  createdAt: string;
  updatedAt?: string;
};

export type ChatType = {
  id: number;
  clientId: number;
  masterId: number;
  bookingId?: number | null;
  client?: ChatUserType;
  master?: ChatUserType;
  Booking?: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    Servizi?: Pick<ServiziType, "id" | "title" | "titleEn" | "price" | "duration">;
  };
  ChatMessages?: ChatMessageType[];
  createdAt: string;
  updatedAt: string;
};

export type CreateChatPayload = {
  clientId?: number;
  masterId: number;
  bookingId?: number | null;
};
