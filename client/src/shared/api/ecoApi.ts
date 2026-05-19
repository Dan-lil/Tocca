import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { EcoReviewType, ServerResponseType } from "@/shared/types";

const ECO_API_URLS = {
  findByMaster: (masterId: number | string) => `/eco/reviews/master/${masterId}`,
} as const;

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
