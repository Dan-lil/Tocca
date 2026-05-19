import { createSlice } from '@reduxjs/toolkit';
import { BookingState } from '@/entities/booking/model/index';
import { fetchUpcomingBookingsThunk, fetchPastBookingsThunk, cancelBookingThunk, createBookingThunk } from "@/entities/booking/api/BookingApiThunk";


const initialState: BookingState = {
  upcomingBookings: [],
  pastBookings: [],
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {

  },
   extraReducers: (builder) => {
      builder.addCase(fetchUpcomingBookingsThunk.pending, (state) => {
        state.loading = true;
      })
      builder.addCase(fetchUpcomingBookingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingBookings = action.payload;  // ← сюда записываем записи
      })
      builder.addCase(fetchUpcomingBookingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Ошибка';
      })


       builder.addCase(fetchPastBookingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      builder.addCase(fetchPastBookingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.pastBookings = action.payload;
      })
      builder.addCase(fetchPastBookingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Ошибка загрузки истории';
      })

      builder.addCase(cancelBookingThunk.fulfilled, (state, action) => {
        state.upcomingBookings = state.upcomingBookings.filter(
          (b) => b.id !== action.payload.bookingId
        );
        const pastBooking = state.pastBookings.find((b) => b.id === action.payload.bookingId);
        if (pastBooking) {
          pastBooking.status = 'cancelled';
        }
      })

      builder.addCase(createBookingThunk.fulfilled, (state, action) => {
        state.upcomingBookings.unshift(action.payload);
      });
  },
});

export const bookingReducer = bookingSlice.reducer;
