import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { ServerResponseType, ShaduleType } from "@/shared/types";

const SHADULE_API_URLS = {
  findByMaster: (masterId: number | string) => `/shadule/findByMasterId/${masterId}`,
} as const;

export async function getShadulesByMaster(masterId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ShaduleType[]>>(
      SHADULE_API_URLS.findByMaster(masterId),
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить расписание мастера";

    throw new Error(message);
  }
}
