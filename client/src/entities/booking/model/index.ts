export type Booking = {
    id: number;
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
    id: number;
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