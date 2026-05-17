export type Sale = {
      masterId: number,
      bookingId: number,
      serviziId: number,
      finalPrice: number,
      discount: number,
      comment: string,
      date: string,
      }

export type SaleState = {
  salesForClient: Sale[];
  loading: boolean;
  error: string | null;
}

