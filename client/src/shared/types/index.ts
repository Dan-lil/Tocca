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

export type BookingModalPayload = {
  categoryId: number;
  categoryTitle: string;
  masterId: number;
  masterName?: string;
  services?: ServiziType[];
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
