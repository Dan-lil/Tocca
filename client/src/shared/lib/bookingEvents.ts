import { BookingModalPayload } from "@/shared/types";

export const BOOKING_MODAL_EVENT = "open-booking-modal";

export function dispatchBookingModalOpen(payload?: BookingModalPayload) {
  window.dispatchEvent(
    new CustomEvent<BookingModalPayload | undefined>(BOOKING_MODAL_EVENT, {
      detail: payload,
    }),
  );
}
