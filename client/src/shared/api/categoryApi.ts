import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { CategoryType, ServerResponseType } from "@/shared/types";

// Храним адреса category endpoints в одном месте
const CATEGORY_API_URLS = {
  findAll: "/category/categories",
  findById: (id: number | string) => `/category/categories/${id}`,
} as const;

export async function getCategories() {
  try {
    // Получаем список категорий для dropdown и страниц услуг
    const { data } = await axiosInstance.get<ServerResponseType<CategoryType[]>>(
      CATEGORY_API_URLS.findAll,
    );

    return data.data ?? [];
  } catch (error) {
    // Приводим ошибку axios к читаемому сообщению для UI
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить категории";

    throw new Error(message);
  }
}

export async function getCategoryById(id: number | string) {
  try {
    // Получаем одну категорию для страницы services/[categoryId]
    const { data } = await axiosInstance.get<ServerResponseType<CategoryType>>(
      CATEGORY_API_URLS.findById(id),
    );

    if (!data.data) {
      throw new Error("Категория не найдена");
    }

    return data.data;
  } catch (error) {
    // Возвращаем либо серверный текст ошибки, либо наш fallback
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось загрузить категорию");

    throw new Error(message);
  }
}
