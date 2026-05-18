import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { ServerResponseType, ServiziType } from "@/shared/types";

const SERVIZI_API_URLS = {
  findByCategory: (categoryId: number | string) =>
    `/servizi/findByCategory/${categoryId}`,
} as const;

export async function getServicesByCategory(categoryId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ServiziType[]>>(
      SERVIZI_API_URLS.findByCategory(categoryId),
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить услуги категории";

    throw new Error(message);
  }
}
