import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import { MasterSocialType, ServerResponseType } from "@/shared/types";

type SaveMasterSocialPayload = {
  network: string;
  contact: string;
};

export async function getMyMasterSocials() {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<MasterSocialType[]>>(
      "/social/find",
    );

    return data.data ?? [];
  } catch (error) {
    const response = (error as AxiosError<ServerResponseType<null>>).response;

    if (response?.status === 404) {
      return [];
    }

    throw new Error(response?.data?.message ?? "Не удалось загрузить социальные сети");
  }
}

export async function createMasterSocial(payload: SaveMasterSocialPayload) {
  const { data } = await axiosInstance.post<ServerResponseType<MasterSocialType>>(
    "/social/create",
    payload,
  );

  if (!data.data) {
    throw new Error(data.message || "Не удалось сохранить социальную сеть");
  }

  return data.data;
}

export async function deleteMasterSocial(id: number | string) {
  await axiosInstance.delete<ServerResponseType<null>>(`/social/delete/${id}`);
}
