import { createSlice } from "@reduxjs/toolkit";
import { initialUserState } from "../model";
import {
    deleteAccountThunk,
    loginThunk,
    logoutThunk,
    refreshTokenThunk,
    registerThunk,
    telegramLoginThunk,
    updateUserProfileThunk,
} from '../api/UserApiThunk';

// создаём slice - часть хранилища, которая отвечает за состояние пользователя
const userSlice = createSlice({
    name: 'user',
    initialState: initialUserState,
    reducers: {
        setUser: (state, action) => { state.user = action.payload },
        setError: (state, action) => { state.error = action.payload }
    },
    extraReducers: (builder) => {

        // Refresh Token
        builder.addCase(refreshTokenThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(refreshTokenThunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = action.payload
            state.error = null;
        })
        builder.addCase(refreshTokenThunk.rejected, (state) => {
            state.isLoading = false;
            state.isInitialized = true;
        })

        // Register
        builder.addCase(registerThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(registerThunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = action.payload
            state.error = null;
        })
        builder.addCase(registerThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload ?? 'Ошибка при регистрации'
        })

        // Login
        builder.addCase(loginThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(loginThunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = action.payload
            state.error = null;
        })
        builder.addCase(loginThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload ?? 'Ошибка при входе в приложение'
        })

        // Logout
        builder.addCase(logoutThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(logoutThunk.fulfilled, (state) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = null
            state.error = null;
        })
        builder.addCase(logoutThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload ?? 'Ошибка при выходе из приложения'
        })

        // Delete account
        builder.addCase(deleteAccountThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(deleteAccountThunk.fulfilled, (state) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = null
            state.error = null;
        })
        builder.addCase(deleteAccountThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload ?? 'Не удалось удалить аккаунт'
        })

        // Telegram login
        builder.addCase(telegramLoginThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(telegramLoginThunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.user = action.payload
            state.error = null;
        })
        builder.addCase(telegramLoginThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload ?? 'Ошибка при входе через Telegram'
        })

        // Update profile
        builder.addCase(updateUserProfileThunk.pending, (state) => {
            state.error = null;
            state.isLoading = true
        })
        builder.addCase(updateUserProfileThunk.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload
            state.error = null;
        })
        builder.addCase(updateUserProfileThunk.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload ?? 'Ошибка при обновлении профиля'
        })
    }
})

export const { setUser, setError } = userSlice.actions;

export const userReducer = userSlice.reducer;
