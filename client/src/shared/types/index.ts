export type ServerResponseType<T> = {
    statusCode: number;
    message: string;
    data: T | null;
    error: string | null;
}

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
  createdAt?: string;
  updatedAt?: string;
};

export type BookingModalPayload = {
  categoryId: number;
  categoryTitle: string;
  masterId: number;
  serviziId: number;
  serviceTitle: string;
  serviceDescription: string;
  price: number;
  duration: number;
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
