import { createChat } from "@/shared/api/chatApi";

type RouterWithPush = {
  push: (href: string) => void;
};

export async function openDirectChat(router: RouterWithPush, masterId: number) {
  const chat = await createChat({ masterId });

  router.push(`/messages?chatId=${chat.id}`);
}
