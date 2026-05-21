import { axiosInstance, setAccessToken } from "@/shared/lib/axiosInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    TelegramLoginPayload,
    UserLoginData,
    UserProfileUpdateData,
    UserRegisterData,
    UserType,
    UserWithTokenType,
} from "../model";
import { ServerResponseType } from "@/shared/types";
import { AxiosError } from "axios";


// названия действий, которые будут создаваться thunk-ами
const USER_THUNK_NAMES = {
    REGISTER: "user/register",
    LOGIN: "user/login",
    TELEGRAM_LOGIN: "user/telegramLogin",
    REFRESH: "user/refresh",
    LOGOUT: "user/logout",
    UPDATE_PROFILE: "user/updateProfile",
    DELETE_ACCOUNT: "user/deleteAccount",
} as const;


// адреса на бэкенде для API-запросов
const USER_API_URLS = {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    TELEGRAM_LOGIN: "/auth/telegram",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    UPDATE_PROFILE: "/auth/profile",
    DELETE_ACCOUNT: "/auth/profile",
} as const;

//thunk - выполняет работу асинхронно, генерирует action и передаёт его в reducer
export const refreshTokenThunk = createAsyncThunk<UserType, void, { rejectValue: string }>(USER_THUNK_NAMES.REFRESH, async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.get<ServerResponseType<UserWithTokenType>>(USER_API_URLS.REFRESH);
        
        if (data.statusCode === 200 && data.data?.user) {
            setAccessToken(data.data?.accessToken ?? '');
            return data.data?.user ?? null;
        }
        
        return rejectWithValue(data.message ?? 'Ошибка при обновлении токена')
    } catch (error) {
        return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при обновлении токена')
    }
});

export const registerThunk = createAsyncThunk<UserType, UserRegisterData, { rejectValue: string }>(USER_THUNK_NAMES.REGISTER, async (userData, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post<ServerResponseType<UserWithTokenType>>(USER_API_URLS.REGISTER, userData);

        if (data.statusCode === 201 && data.data?.user) {
            setAccessToken(data.data?.accessToken ?? '');
            return data.data?.user ?? null;
        }
        return rejectWithValue(data.message ?? 'Ошибка при регистрации')
    } catch (error) {
        return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при регистрации')
    }
});


export const loginThunk = createAsyncThunk<UserType, UserLoginData, { rejectValue: string }>(USER_THUNK_NAMES.LOGIN, async (userData, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post<ServerResponseType<UserWithTokenType>>(USER_API_URLS.LOGIN, userData);

        if (data.statusCode === 200 && data.data?.user) {
            setAccessToken(data.data?.accessToken ?? '');
            return data.data?.user ?? null;
        }
        return rejectWithValue(data.message ?? 'Ошибка при входе в приложение')
    } catch (error) {
        return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при входе в приложение')
    }
});

export const logoutThunk = createAsyncThunk<null, void, { rejectValue: string }>(USER_THUNK_NAMES.LOGOUT, async (_, { rejectWithValue }) => {
    try {
        const { data } = await axiosInstance.post<ServerResponseType<null>>(USER_API_URLS.LOGOUT);

        if (data.statusCode === 200) {
            setAccessToken('');
            return null;
        }
        return rejectWithValue(data.message ?? 'Ошибка при выходе из приложения')
    } catch (error) {
        return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при выходе из приложения')
    }
});

export const deleteAccountThunk = createAsyncThunk<null, void, { rejectValue: string }>(
    USER_THUNK_NAMES.DELETE_ACCOUNT,
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.delete<ServerResponseType<null>>(
                USER_API_URLS.DELETE_ACCOUNT,
            );

            if (data.statusCode === 200) {
                setAccessToken('');
                return null;
            }

            return rejectWithValue(data.message ?? 'Не удалось удалить аккаунт');
        } catch (error) {
            return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Не удалось удалить аккаунт');
        }
    },
);

export const telegramLoginThunk = createAsyncThunk<UserType, TelegramLoginPayload, { rejectValue: string }>(
    USER_THUNK_NAMES.TELEGRAM_LOGIN,
    async (telegramData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post<ServerResponseType<UserWithTokenType>>(
                USER_API_URLS.TELEGRAM_LOGIN,
                telegramData,
            );

            if (data.statusCode === 200 && data.data?.user) {
                setAccessToken(data.data?.accessToken ?? '');
                return data.data?.user ?? null;
            }

            return rejectWithValue(data.message ?? 'Ошибка при входе через Telegram');
        } catch (error) {
            return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при входе через Telegram');
        }
    },
);

export const updateUserProfileThunk = createAsyncThunk<UserType, UserProfileUpdateData, { rejectValue: string }>(
    USER_THUNK_NAMES.UPDATE_PROFILE,
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.put<ServerResponseType<UserWithTokenType>>(
                USER_API_URLS.UPDATE_PROFILE,
                userData,
            );

            if (data.statusCode === 200 && data.data?.user) {
                setAccessToken(data.data.accessToken ?? '');
                return data.data.user;
            }

            return rejectWithValue(data.message ?? 'Ошибка при обновлении профиля');
        } catch (error) {
            return rejectWithValue((error as AxiosError<ServerResponseType<null>>).response?.data?.message ?? 'Ошибка при обновлении профиля');
        }
    },
);
