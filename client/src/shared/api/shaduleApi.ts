import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { ServerResponseType, ShaduleType } from "@/shared/types";

const SHADULE_API_URLS = {
  create: "/shadule/create",
  findByMaster: (masterId: number | string) => `/shadule/findByMasterId/${masterId}`,
  update: (id: number | string) => `/shadule/update/${id}`,
  delete: (id: number | string) => `/shadule/delete/${id}`,
  deleteByMaster: (masterId: number | string) => `/shadule/deleteByMasterId/${masterId}`,
} as const;

export async function getShadulesByMaster(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ShaduleType[]>>(
      SHADULE_API_URLS.findByMaster(masterId),
    );

    return data.data ?? [];
  } catch (error) {
    if ((error as AxiosError<ServerResponseType<null>>).response?.status === 404) {
      return [];
    }

    const response = (error as AxiosError<ServerResponseType<null>>).response?.data;
    const message =
      response?.error ??
      response?.message ??
      "Не удалось загрузить расписание мастера";

    throw new Error(message);
  }
}

export type SaveShadulePayload = {
  masterId: number;
  dayOdWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
};

export async function createShadule(payload: SaveShadulePayload) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<ShaduleType>>(
      SHADULE_API_URLS.create,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось создать расписание");
    }

    return data.data;
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response?.data;
    const message =
      response?.error ??
      response?.message ??
      (error instanceof Error ? error.message : "Не удалось создать расписание");

    throw new Error(message);
  }
}

export async function updateShadule(id: number | string, payload: SaveShadulePayload) {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<ShaduleType>>(
      SHADULE_API_URLS.update(id),
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось обновить расписание");
    }

    return data.data;
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response?.data;
    const message =
      response?.error ??
      response?.message ??
      (error instanceof Error ? error.message : "Не удалось обновить расписание");

    throw new Error(message);
  }
}

export async function deleteShadule(id: number | string) {
  try {
    await axiosInstance.delete<ServerResponseType<null>>(SHADULE_API_URLS.delete(id));
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response?.data;
    const message =
      response?.error ??
      response?.message ??
      (error instanceof Error ? error.message : "Не удалось удалить слот расписания");

    throw new Error(message);
  }
}

export async function deleteShadulesByMaster(masterId: number | string) {
  try {
    await axiosInstance.delete<ServerResponseType<null>>(
      SHADULE_API_URLS.deleteByMaster(masterId),
    );
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response?.data;
    const message =
      response?.error ??
      response?.message ??
      (error instanceof Error ? error.message : "Не удалось очистить расписание мастера");

    throw new Error(message);
  }
}
