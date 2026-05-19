import { createChat } from "@/shared/api/chatApi";
import { BookingType } from "@/shared/types";

type RouterWithPush = {
  push: (href: string) => void;
};

export async function openBookingChat(router: RouterWithPush, booking: BookingType) {
  const chat = await createChat({
    bookingId: booking.id,
    clientId: booking.clientId,
    masterId: booking.masterId,
  });

  router.push(`/messages?chatId=${chat.id}`);
}
