import { AxiosError } from "axios";

import { axiosInstance } from "@/shared/lib/axiosInstance";
import {
  ChatMessageType,
  ChatType,
  CreateChatPayload,
  ServerResponseType,
} from "@/shared/types";

const CHAT_API_URLS = {
  create: "/chat/chats",
  myChats: "/chat/chats",
  messages: (chatId: number | string) => `/chat/chats/${chatId}/messages`,
} as const;

export async function createChat(payload: CreateChatPayload) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<ChatType>>(
      CHAT_API_URLS.create,
      payload,
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось открыть чат");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось открыть чат";

    throw new Error(message);
  }
}

export async function getMyChats() {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ChatType[]>>(
      CHAT_API_URLS.myChats,
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить чаты";

    throw new Error(message);
  }
}

export async function getChatMessages(chatId: number | string) {
  try {
    const { data } = await axiosInstance.get<ServerResponseType<ChatMessageType[]>>(
      CHAT_API_URLS.messages(chatId),
    );

    return data.data ?? [];
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось загрузить сообщения";

    throw new Error(message);
  }
}

export async function createChatMessage(chatId: number | string, text: string) {
  try {
    const { data } = await axiosInstance.post<ServerResponseType<ChatMessageType>>(
      CHAT_API_URLS.messages(chatId),
      { text },
    );

    if (!data.data) {
      throw new Error(data.message || "Не удалось отправить сообщение");
    }

    return data.data;
  } catch (error) {
    const message =
      (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
      "Не удалось отправить сообщение";

    throw new Error(message);
  }
}
