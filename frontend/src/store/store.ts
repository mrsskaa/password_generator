import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice';

export const store = configureStore({
    reducer: {
        // сюда будем добавлять слайсы
        auth: authReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch