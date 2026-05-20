import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { RecommendedMasterType, ServerResponseType } from "@/shared/types";

const AI_API_URLS = {
  myMasterRecommendations: "/ai/recommendations/masters/me",
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
