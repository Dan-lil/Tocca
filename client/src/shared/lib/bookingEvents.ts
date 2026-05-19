import { BookingModalPayload } from "@/shared/types";

export const BOOKING_MODAL_EVENT = "open-booking-modal";
export const BOOKING_MODAL_CLOSE_EVENT = "close-booking-modal";

export function dispatchBookingModalOpen(payload?: BookingModalPayload) {
  window.dispatchEvent(
    new CustomEvent<BookingModalPayload | undefined>(BOOKING_MODAL_EVENT, {
      detail: payload,
    }),
  );
}

export function dispatchBookingModalClose() {
  window.dispatchEvent(new CustomEvent(BOOKING_MODAL_CLOSE_EVENT));
}
