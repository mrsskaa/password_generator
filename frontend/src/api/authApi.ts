import axios from 'axios';
import type { loginFormData } from '../schemas/loginSchema';
import type { registerFormData } from '../schemas/regSchema';
import type { User } from '../types/auth';
import type { GeneratePasswordPayload, GeneratePasswordResponse } from '../types/generator';

interface AuthResponse {
  user: User;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';
axios.defaults.withCredentials = true;
const GENERATOR_ENDPOINT = import.meta.env.VITE_PASSWORD_GENERATOR_ENDPOINT ?? '/api/generate-password';
const FORGOT_PASSWORD_PATH = import.meta.env.VITE_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/forgot-password';
const FORGOT_PASSWORD_CONFIRM_PATH =
  import.meta.env.VITE_FORGOT_PASSWORD_CONFIRM_ENDPOINT ?? '/api/auth/verify-code';
const RESEND_FORGOT_PASSWORD_CODE_PATH =
  import.meta.env.VITE_RESEND_FORGOT_PASSWORD_CODE_ENDPOINT ?? '/api/auth/forgot-password/resend-code';
const RESET_FORGOT_PASSWORD_PATH = import.meta.env.VITE_RESET_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/reset-password';
const REGISTER_CONFIRM_PATH = import.meta.env.VITE_REGISTER_CONFIRM_ENDPOINT ?? '/api/auth/register/confirm';
const RESEND_REGISTER_CODE_PATH =
  import.meta.env.VITE_RESEND_REGISTER_CODE_ENDPOINT ?? '/api/auth/register/resend-code';

export const loginRequest = async (payload: loginFormData): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, {
    username: payload.email,
    password: payload.password,
  });
  return response.data;
};

export const registerRequest = async (payload: registerFormData): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/register`, {
    username: payload.email,
    password: payload.password,
    email: payload.email,
  });
  return response.data;
};

export const generatePasswordRequest = async (
  payload: GeneratePasswordPayload,
): Promise<GeneratePasswordResponse> => {
  const response = await axios.post<GeneratePasswordResponse>(`${API_URL}${GENERATOR_ENDPOINT}`, payload);
  return response.data;
};

export interface ForgotPasswordResponse {
  message?: string;
}

export const forgotPasswordRequest = async (payload: {
  email: string;
}): Promise<ForgotPasswordResponse> => {
  const response = await axios.post<ForgotPasswordResponse>(`${API_URL}${FORGOT_PASSWORD_PATH}`, payload);
  return response.data;
};

export const confirmForgotPasswordRequest = async (payload: {
  email: string;
  code: string;
}): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(`${API_URL}${FORGOT_PASSWORD_CONFIRM_PATH}`, payload);
  return response.data;
};

export const resendForgotPasswordCodeRequest = async (payload: { email: string }): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(`${API_URL}${RESEND_FORGOT_PASSWORD_CODE_PATH}`, payload);
  return response.data;
};

export const resetForgotPasswordRequest = async (payload: {
  email: string;
  password: string;
}): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(`${API_URL}${RESET_FORGOT_PASSWORD_PATH}`, payload);
  return response.data;
};

export interface RegisterConfirmResponse {
  message?: string;
  user?: User;
}

export const confirmRegistrationRequest = async (payload: {
  email: string;
  code: string;
}): Promise<RegisterConfirmResponse> => {
  const response = await axios.post<RegisterConfirmResponse>(`${API_URL}${REGISTER_CONFIRM_PATH}`, payload);
  return response.data;
};

export const resendRegistrationCodeRequest = async (payload: { email: string }): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(`${API_URL}${RESEND_REGISTER_CODE_PATH}`, payload);
  return response.data;
};
