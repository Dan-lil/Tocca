import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { BookingType, CreateBookingPayload, ServerResponseType } from "@/shared/types";

// Адреса booking endpoints собраны в одном объекте
const BOOKING_API_URLS = {
  create: "/booking/bookings",
  findByMaster: (masterId: number | string) => `/booking/bookings/master/${masterId}`,
  update: (id: number | string) => `/booking/bookings/${id}`,
} as const;

export async function createBooking(payload: CreateBookingPayload) {
  try {
    // Отправляем на сервер заявку на запись с выбранной услугой
    const { data } = await axiosInstance.post<ServerResponseType<BookingType>>(
      BOOKING_API_URLS.create,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось создать запись");
    }

    return data.data;
  } catch (error) {
    // Преобразуем ответ сервера или сетевую ошибку в единый Error
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось создать запись");

    throw new Error(message);
  }
}

export async function updateBooking(id: number | string, payload: Partial<CreateBookingPayload>) {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<BookingType>>(
      BOOKING_API_URLS.update(id),
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось обновить запись");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось обновить запись");

    throw new Error(message);
  }
}

export async function getBookingsByMaster(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<BookingType[]>>(
      BOOKING_API_URLS.findByMaster(masterId),
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить записи мастера";

    throw new Error(message);
  }
}
