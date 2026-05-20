import { configureStore } from '@reduxjs/toolkit';
import { userReducer } from '@/entities/user/slice/userSlice';
import { bookingReducer } from '@/entities/booking/slice/bookingSlice';
import { saleReducer } from '@/entities/sale/slice/saleSlice';
import masterReducer  from '@/entities/master/slice/masterSlice';


// создаём store - глобальное хранилище данных
export const store = configureStore({
    reducer: { user: userReducer,
        booking: bookingReducer,
        sale: saleReducer,
        master: masterReducer,
    }
});


// экспортируем типы для написания кастомных хуков useAppSelector и useAppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;