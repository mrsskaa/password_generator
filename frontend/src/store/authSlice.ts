import { createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  // ========== ЛОГИН ==========
  user: User | null;
  isAuthenticated: boolean;
  loginLoading: boolean;
  loginError: string | null;
  
  // ========== РЕГИСТРАЦИЯ ==========
  isRegistering: boolean;
  registerError: string | null;
  registerSuccess: boolean;
}

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
    loginSuccess: (state, action) => {
      state.loginLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    loginFailure: (state, action) => {
      state.loginLoading = false;
      state.loginError = action.payload;
    },
    
    // ========== РЕГИСТРАЦИЯ ==========
    registerStart: (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.registerSuccess = false;
    },
    registerSuccess: (state, action) => {
      state.isRegistering = false;
      state.registerSuccess = true;

    },
    registerFailure: (state, action) => {
      state.isRegistering = false;
      state.registerError = action.payload;
      state.registerSuccess = false;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
    
    logout: (state) => {
      return initialState;
    },
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
  registerSuccess,
  registerFailure,
  clearRegisterSuccess,
  // Общие
  logout,
  clearErrors,
} = authSlice.actions;

export default authSlice.reducer;