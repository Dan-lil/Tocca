import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { EcoReviewType, ServerResponseType } from "@/shared/types";

const ECO_API_URLS = {
  create: "/eco/reviews",
  findByClient: (clientId: number | string) => `/eco/reviews/client/${clientId}`,
  findByMaster: (masterId: number | string) => `/eco/reviews/master/${masterId}`,
} as const;

type CreateReviewPayload = {
  masterId: number;
  bookingId: number;
  rating: number;
  text: string;
};

export async function createReview(payload: CreateReviewPayload) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<EcoReviewType>>(
      ECO_API_URLS.create,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось создать отзыв");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось создать отзыв");

    throw new Error(message);
  }
}

export async function getReviewsByClient(clientId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<EcoReviewType[]>>(
      ECO_API_URLS.findByClient(clientId),
    );

    return data.data ?? [];
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response;

    if (response?.status === 404) {
      return [];
    }

    const message = response?.data?.message ?? "Не удалось загрузить ваши отзывы";

    throw new Error(message);
  }
}

export async function getReviewsByMaster(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<EcoReviewType[]>>(
      ECO_API_URLS.findByMaster(masterId),
    );

    return data.data ?? [];
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response;

    if (response?.status === 404) {
      return [];
    }

    const message = response?.data?.message ?? "Не удалось загрузить отзывы мастера";

    throw new Error(message);
  }
}
