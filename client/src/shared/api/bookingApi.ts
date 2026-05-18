import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { CreateBookingPayload, ServerResponseType } from "@/shared/types";

const BOOKING_API_URLS = {
  create: "/booking/bookings",
} as const;

export async function createBooking(payload: CreateBookingPayload) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<CreateBookingPayload>>(
      BOOKING_API_URLS.create,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось создать запись");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось создать запись");

    throw new Error(message);
  }
}
