import { configureStore } from '@reduxjs/toolkit';
import { userReducer } from '@/entities/user/slice/userSlice';


// создаём store - глобальное хранилище данных
export const store = configureStore({
    reducer: { user: userReducer }
});


// экспортируем типы для написания кастомных хуков useAppSelector и useAppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;