export type ServerResponseType<T> = {
  statusCode: number;
  message: string;
  data: T | null;
  error: string | null;
};

export type CategoryType = {
  id: number;
  title: string;
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
  description: string;
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
    description?: string | null;
    city?: string | null;
    address?: string | null;
    experience?: number | null;
    category?: string | null;
    rating?: number | null;
  } | null;
  portfolio: PublicMasterPortfolioItem[];
  socials?: MasterSocialType[];
};

export type BookingModalPayload = {
  categoryId: number;
  categoryTitle: string;
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
