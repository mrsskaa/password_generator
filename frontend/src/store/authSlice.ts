import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/auth';

const initialState: AuthState = {
  // Логин
  user: null,
  isAuthenticated: false,
  loginLoading: false,
  loginError: null,
  
  // Регистрация
  isRegistering: false,
  registerError: null,
  registerSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // ========== ЛОГИН ==========
    loginStart: (state) => {
      state.loginLoading = true;
      state.loginError = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loginLoading = false;
      state.loginError = null;
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loginLoading = false;
      state.loginError = action.payload;
    },
    
    // ========== РЕГИСТРАЦИЯ ==========
    registerStart: (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.registerSuccess = false;
    },
    /** Регистрация на сервере прошла; пользователь ещё не залогинен (сессия после подтверждения). */
    registerRequestFinished: (state) => {
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = true;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isRegistering = false;
      state.registerError = action.payload;
      state.registerSuccess = false;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
    
    logout: () => initialState,
    clearErrors: (state) => {
      state.loginError = null;
      state.registerError = null;  
    },
  },
});


export const {
  // Логин
  loginStart,
  loginSuccess,
  loginFailure,
  // Регистрация
  registerStart,
  registerRequestFinished,
  registerFailure,
  clearRegisterSuccess,
  // Общие
  logout,
  clearErrors,
} = authSlice.actions;

export default authSlice.reducer;