import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { Booking, NewBooking } from '@/entities/booking/model/index';
import { ServerResponseType } from "@/shared/types/index";
import { AxiosError } from 'axios';

const BOOKING_THUNK_NAMES = {
  FETCH_UPCOMING: 'booking/fetchUpcoming', //будущие запсии
  FETCH_PAST: 'booking/fetchPast', //прошедшие записи
  CANCEL_BOOKING: 'booking/cancel',
  CREATE_BOOKING: 'booking/create',
} as const;


const BOOKING_API_URLS = {
  UPCOMING: '/bookings/client/upcoming',
  PAST: '/bookings/client/past',
  CANCEL: (id: number) => `/bookings/${id}/cancel`,
  CREATE: '/bookings',
} as const;


export const fetchUpcomingBookingsThunk = createAsyncThunk<Booking[],void,{ rejectValue: string }>(BOOKING_THUNK_NAMES.FETCH_UPCOMING,async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ServerResponseType<Booking[]>>(
        BOOKING_API_URLS.UPCOMING
      );

      if (data.statusCode === 200 && data.data) {
        return data.data;
      }
      return rejectWithValue(data.message ?? 'Ошибка загрузки записей');
    } catch (error) {
      return rejectWithValue(
        (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
          'Ошибка загрузки записей'
      );
    }
  }
);

// Получить историю записей
export const fetchPastBookingsThunk = createAsyncThunk<Booking[],void,{ rejectValue: string }>(BOOKING_THUNK_NAMES.FETCH_PAST,async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ServerResponseType<Booking[]>>(
        BOOKING_API_URLS.PAST
      );

      if (data.statusCode === 200 && data.data) {
        return data.data;
      }
      return rejectWithValue(data.message ?? 'Ошибка загрузки истории');
    } catch (error) {
      return rejectWithValue(
        (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
          'Ошибка загрузки истории'
      );
    }
  }
);


export const cancelBookingThunk = createAsyncThunk<{ bookingId: number },{ bookingId: number; reason?: string },{ rejectValue: string }>(BOOKING_THUNK_NAMES.CANCEL_BOOKING,async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch<ServerResponseType<null>>(BOOKING_API_URLS.CANCEL(bookingId),{ cancelReason: { type: 'user', defaultValue: reason || 'Отменено пользователем' } }
      );

      if (data.statusCode === 200) {
        return { bookingId };
      }
      return rejectWithValue(data.message ?? 'Ошибка отмены записи');
    } catch (error) {
      return rejectWithValue(
        (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
          'Ошибка отмены записи'
      );
    }
  }
);

export const createBookingThunk = createAsyncThunk<Booking,NewBooking,{ rejectValue: string }>(BOOKING_THUNK_NAMES.CREATE_BOOKING, async (bookingData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post<ServerResponseType<Booking>>(
        BOOKING_API_URLS.CREATE,
        bookingData
      );

      if (data.statusCode === 201 && data.data) {
        return data.data;
      }
      return rejectWithValue(data.message ?? 'Ошибка создания записи');
    } catch (error) {
      return rejectWithValue(
        (error as AxiosError<ServerResponseType<null>>).response?.data?.message ??
          'Ошибка создания записи'
      );
    }
  }
);

