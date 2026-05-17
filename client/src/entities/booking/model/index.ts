export type Booking = {
    clientId: number;
    masterId: number;
    serviziId: number;
    date: string;
    startTime: number;
    endTime: number,
    status: string,
    clientComment:string,
    cancelReason: {
    type: string,
    defaultValue: "Отменено без указания причин",
      }
}

export type NewBooking = {
    masterId: number;
    serviziId: number;
    date: string;
    startTime: number;
    endTime: number;
    clientComment?: string;
}

export type CancelReason = {
    type: string;
    defaultValue: "Отменено без указания причин"
}

export interface BookingState {
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  loading: boolean;
  error: string | null;
}