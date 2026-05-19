import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { SaleType, ServerResponseType } from "@/shared/types";

// Здесь лежат адреса запросов к акциям
const SALE_API_URLS = {
  findAll: "/sale/findAll",
} as const;

export async function getSales() {
  try {
    // Загружаем все акции для витрины на главной
    const { data } = await axiosInstance.get<ServerResponseType<SaleType[]>>(
      SALE_API_URLS.findAll,
    );

    return data.data ?? [];
  } catch (error) {
    // Сводим ошибку сети или сервера к одному сообщению для компонента
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить акции";

    throw new Error(message);
  }
}
