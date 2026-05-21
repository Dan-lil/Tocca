import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { PublicMasterProfileType, ServerResponseType } from "@/shared/types";

type MasterLocationPayload = {
  lat?: number;
  lon?: number;
  address?: string;
};

type MasterLocationResponse = {
  lat: number;
  lon: number;
};

export async function getPublicMasterProfile(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<PublicMasterProfileType>>(
      `/profile/${masterId}`,
    );

    if (!data.data) {
      throw new Error("Профиль мастера не найден");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось загрузить профиль мастера");

    throw new Error(message);
  }
}

export async function updateMasterLocation(payload: MasterLocationPayload) {
  try {
    const { data } = await axiosInstance.put<ServerResponseType<MasterLocationResponse>>(
      "/profile/location",
      payload,
    );

    if (!data.data) {
      throw new Error("Координаты мастера не сохранены");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      (error instanceof Error ? error.message : "Не удалось сохранить координаты мастера");

    throw new Error(message);
  }
}
