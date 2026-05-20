import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import {
  BookingType,
  RecommendedMasterType,
  ServerResponseType,
} from "@/shared/types";

export type AIBookingOption = {
  id: string;
  masterId: number;
  serviziId: number;
  initials: string;
  name: string;
  meta: string;
  service: string;
  price: string;
  slot: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceTitle: string;
};

const AI_API_URLS = {
  myMasterRecommendations: "/ai/recommendations/masters/me",
  searchBookingOptions: "/ai/booking-assistant/search",
  confirmBooking: "/ai/booking-assistant/book",
} as const;

export async function getMyMasterRecommendations(limit = 6) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<RecommendedMasterType[]>>(
      AI_API_URLS.myMasterRecommendations,
      {
        params: { limit },
      },
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось загрузить рекомендации");

    throw new Error(message);
  }
}

export async function searchAIBookingOptions(prompt: string, limit = 6) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<AIBookingOption[]>>(
      AI_API_URLS.searchBookingOptions,
      {
        prompt,
        limit,
      },
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.error ??
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось подобрать запись");

    throw new Error(message);
  }
}

export async function confirmAIBooking(payload: {
  masterId: number;
  serviziId: number;
  date: string;
  startTime: string;
  endTime: string;
  clientComment?: string;
}) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<BookingType>>(
      AI_API_URLS.confirmBooking,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось создать запись");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.error ??
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось создать запись");

    throw new Error(message);
  }
}
