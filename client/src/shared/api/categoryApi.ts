import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { CategoryType, ServerResponseType } from "@/shared/types";

const CATEGORY_API_URLS = {
  findAll: "/category/categories",
  findById: (id: number | string) => `/category/categories/${id}`,
} as const;

export async function getCategories() {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<CategoryType[]>>(
      CATEGORY_API_URLS.findAll,
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить категории";

    throw new Error(message);
  }
}

export async function getCategoryById(id: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<CategoryType>>(
      CATEGORY_API_URLS.findById(id),
    );

    if (!data.data) {
      throw new Error("Категория не найдена");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось загрузить категорию");

    throw new Error(message);
  }
}
