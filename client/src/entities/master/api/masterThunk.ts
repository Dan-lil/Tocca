import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosInstance } from '@/shared/lib/axiosInstance';
import { ServerResponseType } from "@/shared/types/index";
import { AxiosError } from 'axios';
import { PortfolioItem, MasterStats, MasterEarnings, CreatePortfolio, BookingToMaster} from "@/entities/master/model/index";
import { Servizi, CreateServizi, UpdateServiziDto } from '@/entities/servizi/model/index';


export const fetchMasterStatsThunk = createAsyncThunk<MasterStats, void, { rejectValue: string }>('master/fetchStats', async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ServerResponseType<MasterStats>>('/master/stats');
      if (response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('Нет данных статистики');
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки статистики');
    }
  }
);

export const fetchMasterMoneyThunk = createAsyncThunk<MasterEarnings, void, { rejectValue: string }>('master/fetchEarnings', async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ServerResponseType<MasterEarnings>>('/master/earnings');
      if (response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('Нет данных о заработке');
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки заработка');
    }
  }
);

export const fetchMasterServicesThunk = createAsyncThunk<Servizi[], void,{ rejectValue: string }>('master/fetchServices', async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ServerResponseType<Servizi[]>>('/master/services');
      return response.data.data || [];
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки услуг');
    }
  }
);

export const addServiceThunk = createAsyncThunk<Servizi, CreateServizi, { rejectValue: string }>('master/addService', async (serviceData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ServerResponseType<Servizi>>('/master/services', serviceData);
      if (response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('Не удалось создать услугу');
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка добавления услуги');
    }
  }
);

export const updateServiceThunk = createAsyncThunk<Servizi, UpdateServiziDto, { rejectValue: string }>('master/updateService', async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch<ServerResponseType<Servizi>>(`/master/services/${id}`, updateData);
      if (response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('Не удалось обновить услугу');
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка обновления услуги');
    }
  }
);

export const deleteServiceThunk = createAsyncThunk<number, number, { rejectValue: string }>( 'master/deleteService', async (serviceId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete<ServerResponseType<null>>(`/master/services/${serviceId}`);
      return serviceId;
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка удаления услуги');
    }
  }
);


export const fetchMasterPortfolioThunk = createAsyncThunk<PortfolioItem[], void, { rejectValue: string }>('master/fetchPortfolio', async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ServerResponseType<PortfolioItem[]>>('/master/portfolio');
      return response.data.data || [];
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки портфолио');
    }
  }
);

export const addPortfolioItemThunk = createAsyncThunk< PortfolioItem, CreatePortfolio, { rejectValue: string }>( 'master/addPortfolioItem', async (itemData, {rejectWithValue })=> {
    try {
      const response = await axiosInstance.post<ServerResponseType<PortfolioItem>>('/master/portfolio', itemData);
      if (response.data.data) {
        return response.data.data;
      }
      return rejectWithValue('Не удалось добавить фото');
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка добавления фото');
    }
  }
);

export const deletePortfolioItemThunk = createAsyncThunk<string, string, { rejectValue: string }>( 'master/deletePortfolioItem', async (itemId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete<ServerResponseType<null>>(`/master/portfolio/${itemId}`);
      return itemId;
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка удаления фото');
    }
  }
);


export const fetchUpcomingBookingsForMasterThunk = createAsyncThunk<BookingToMaster[], void, { rejectValue: string }>('master/fetchUpcomingBookings', async (_, {rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<ServerResponseType<BookingToMaster[]>>('/master/bookings/upcoming');
      return response.data.data || [];
    } catch (error) {
      const err = error as AxiosError<ServerResponseType<null>>;
      return rejectWithValue(err.response?.data?.message || 'Ошибка загрузки записей');
    }
  }
);