import axios from 'axios';
import type { loginFormData } from '../schemas/loginSchema';
import type { registerFormData } from '../schemas/regSchema';
import type { User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

axios.defaults.withCredentials = true;

const FORGOT_PASSWORD_PATH = import.meta.env.VITE_FORGOT_PASSWORD_ENDPOINT ?? '/api/forgot-password';
const FORGOT_PASSWORD_CONFIRM_PATH =
  import.meta.env.VITE_FORGOT_PASSWORD_CONFIRM_ENDPOINT ?? '/api/forgot-password/confirm';
const RESEND_FORGOT_PASSWORD_CODE_PATH =
  import.meta.env.VITE_RESEND_FORGOT_PASSWORD_CODE_ENDPOINT ?? '/api/forgot-password/resend-code';
const RESET_FORGOT_PASSWORD_PATH = import.meta.env.VITE_RESET_FORGOT_PASSWORD_ENDPOINT ?? '/api/forgot-password/reset';

export function mapBackendUser(raw: unknown): User {
  const u = raw as Record<string, unknown>;
  return {
    id: Number(u.id),
    username: String(u.username ?? ''),
    email: u.email == null ? null : String(u.email),
    role: String(u.role ?? 'user'),
    created_at: String(u.created_at ?? ''),
  };
}

export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { detail?: unknown };
    const { detail } = data;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: string }).msg);
          }
          return String(item);
        })
        .join(', ');
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

interface LoginResponseBody {
  message: string;
  user: unknown;
}

export const loginRequest = async (payload: loginFormData): Promise<{ message: string; user: User }> => {
  const response = await axios.post<LoginResponseBody>(`${API_URL}/api/auth/login`, {
    username: payload.email,
    password: payload.password,
  });
  return {
    message: response.data.message,
    user: mapBackendUser(response.data.user),
  };
};

interface RegisterResponseBody {
  message: string;
  user: unknown;
}

export const registerRequest = async (payload: registerFormData): Promise<{ message: string; user: User }> => {
  const response = await axios.post<RegisterResponseBody>(`${API_URL}/api/auth/register`, {
    username: payload.email,
    password: payload.password,
    email: payload.email,
  });
  return {
    message: response.data.message,
    user: mapBackendUser(response.data.user),
  };
};

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await axios.get<unknown>(`${API_URL}/api/users/me`);
    return mapBackendUser(res.data);
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await axios.post(`${API_URL}/api/auth/logout`);
}

/**
 * Повторная отправка кода регистрации на бэкенде пока не реализована.
 * Оставляем успешный no-op, чтобы не ломать UI таймера «получить код снова».
 */
export async function resendRegistrationCodeRequest(_payload: { email: string }): Promise<{ message: string }> {
  void _payload;
  return { message: 'Повторная отправка будет доступна после подключения API.' };
}

export { generatePasswordRequest } from './generatorApi';

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
