import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { ServerResponseType, ServiziType } from "@/shared/types";

// Здесь лежат адреса запросов к услугам
const SERVIZI_API_URLS = {
  findAll: "/servizi/findAll",
  findByCategory: (categoryId: number | string) =>
    `/servizi/findByCategory/${categoryId}`,
  findByMaster: (masterId: number | string) => `/servizi/findAll/${masterId}`,
} as const;

export async function getServices() {
  try {
    // Загружаем все услуги для витринных блоков на клиенте
    const { data } = await axiosInstance.get<ServerResponseType<ServiziType[]>>(
      SERVIZI_API_URLS.findAll,
    );

    return data.data ?? [];
  } catch (error) {
    // Сводим ошибку сети или сервера к одному сообщению для компонента
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить услуги";

    throw new Error(message);
  }
}

export async function getServicesByCategory(categoryId: number | string) {
  try {
    // Загружаем услуги, связанные с выбранной категорией
    const { data } = await axiosInstance.get<ServerResponseType<ServiziType[]>>(
      SERVIZI_API_URLS.findByCategory(categoryId),
    );

    return data.data ?? [];
  } catch (error) {
    // Сводим ошибку сети или сервера к одному сообщению для компонента
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить услуги категории";

    throw new Error(message);
  }
}

export async function getServicesByMaster(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ServiziType[]>>(
      SERVIZI_API_URLS.findByMaster(masterId),
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить услуги мастера";

    throw new Error(message);
  }
}
