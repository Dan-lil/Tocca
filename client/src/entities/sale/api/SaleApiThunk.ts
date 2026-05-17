import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from "@/shared/types/index";
import { AxiosError } from 'axios';
import { Sale, SaleState } from "@/entities/sale/model";

export const SALE_THUNK_NAMES = {
  FETCH_FOR_CLIENT: 'sale/fetchForClient',
} as const;

const SALE_API_URLS = {
  FOR_CLIENT: '/sales/for-client',
} as const;

export const fetchSalesForClientThunk = createAsyncThunk<Sale[], void, { rejectValue: string }>(SALE_THUNK_NAMES.FETCH_FOR_CLIENT,async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get<ServerResponseType<Sale[]>>(SALE_API_URLS.FOR_CLIENT);
      if (data.statusCode === 200 && data.data) {
        return data.data;
      }
      return rejectWithValue(data.message ?? 'Ошибка загрузки акций');
    } catch (error) {
      return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка загрузки акций');
    }
  }
); 