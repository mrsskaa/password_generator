import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { loginFormData } from '../schemas/loginSchema';
import type { registerFormData } from '../schemas/regSchema';
import type { User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

axios.defaults.withCredentials = true;

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const FORGOT_PASSWORD_PATH = import.meta.env.VITE_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/forgot-password';
const FORGOT_PASSWORD_CONFIRM_PATH =
  import.meta.env.VITE_FORGOT_PASSWORD_CONFIRM_ENDPOINT ?? '/api/auth/verify-code';
const RESEND_FORGOT_PASSWORD_CODE_PATH =
  import.meta.env.VITE_RESEND_FORGOT_PASSWORD_CODE_ENDPOINT ?? '/api/auth/forgot-password/resend-code';
const RESET_FORGOT_PASSWORD_PATH = import.meta.env.VITE_RESET_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/reset-password';
const REFRESH_TOKEN_PATH = import.meta.env.VITE_REFRESH_TOKEN_ENDPOINT ?? '/api/auth/refresh';
const REGISTER_CONFIRM_PATH = import.meta.env.VITE_REGISTER_CONFIRM_ENDPOINT ?? '/api/auth/register/verify-code';
const RESEND_REGISTER_CODE_PATH =
  import.meta.env.VITE_RESEND_REGISTER_CODE_ENDPOINT ?? '/api/auth/register/resend-code';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshSessionPromise: Promise<void> | null = null;

function getRequestPath(url?: string): string {
  if (!url) {
    return '';
  }
  try {
    return new URL(url, API_URL || window.location.origin).pathname;
  } catch {
    return url;
  }
}

function shouldTryRefresh(config?: InternalAxiosRequestConfig): config is RetriableRequestConfig {
  if (!config) {
    return false;
  }
  const requestConfig = config as RetriableRequestConfig;
  const requestPath = getRequestPath(config.url);
  const refreshExcludedPaths = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/register/verify-code',
    '/api/auth/register/resend-code',
    FORGOT_PASSWORD_PATH,
    FORGOT_PASSWORD_CONFIRM_PATH,
    RESEND_FORGOT_PASSWORD_CODE_PATH,
    RESET_FORGOT_PASSWORD_PATH,
    REFRESH_TOKEN_PATH,
  ];

  return !requestConfig._retry && !refreshExcludedPaths.includes(requestPath);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status !== 401 || !shouldTryRefresh(error.config)) {
      throw error;
    }

    const originalRequest = error.config;
    originalRequest._retry = true;
    refreshSessionPromise ??= axios
      .post(`${API_URL}${REFRESH_TOKEN_PATH}`, undefined, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshSessionPromise = null;
      });

    await refreshSessionPromise;
    return apiClient(originalRequest);
  },
);

export function mapBackendUser(raw: unknown): User {
  const u = raw as Record<string, unknown>;
  return {
    id: String(u.id),
    email: u.email == null ? null : String(u.email),
    created_at: String(u.created_at ?? ''),
  };
}

export function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (data?.detail !== undefined) {
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
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'Нет соединения с сервером. Проверьте, что бэкенд запущен.';
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
  const response = await apiClient.post<LoginResponseBody>('/api/auth/login', {
    email: payload.email,
    password: payload.password,
  });
  return {
    message: response.data.message,
    user: mapBackendUser(response.data.user),
  };
};

interface RegisterResponseBody {
  message: string;
  user: unknown | null;
}

export const registerRequest = async (payload: registerFormData): Promise<{ message: string; user: User | null }> => {
  const response = await apiClient.post<RegisterResponseBody>('/api/auth/register', {
    password: payload.password,
    email: payload.email,
  });
  return {
    message: response.data.message,
    user: response.data.user != null ? mapBackendUser(response.data.user) : null,
  };
};

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await apiClient.get<unknown>('/api/users/me');
    return mapBackendUser(res.data);
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export interface RegisterConfirmResponse {
  message?: string;
  user?: User;
}

export const confirmRegistrationRequest = async (payload: {
  email: string;
  code: string;
}): Promise<RegisterConfirmResponse> => {
  const response = await apiClient.post<RegisterConfirmResponse>(REGISTER_CONFIRM_PATH, payload);
  return response.data;
};

export const resendRegistrationCodeRequest = async (payload: { email: string }): Promise<{ message?: string }> => {
  const response = await apiClient.post<{ message?: string }>(RESEND_REGISTER_CODE_PATH, payload);
  return response.data;
};

export { generatePasswordRequest } from './generatorApi';

export interface ForgotPasswordResponse {
  message?: string;
}

export const forgotPasswordRequest = async (payload: {
  email: string;
}): Promise<ForgotPasswordResponse> => {
  const response = await apiClient.post<ForgotPasswordResponse>(FORGOT_PASSWORD_PATH, payload);
  return response.data;
};

export const confirmForgotPasswordRequest = async (payload: {
  email: string;
  code: string;
}): Promise<{ message?: string; reset_token?: string }> => {
  const response = await apiClient.post<{ message?: string; reset_token?: string }>(
    FORGOT_PASSWORD_CONFIRM_PATH,
    payload,
  );
  return response.data;
};

export const resendForgotPasswordCodeRequest = async (payload: { email: string }): Promise<{ message?: string }> => {
  const response = await apiClient.post<{ message?: string }>(RESEND_FORGOT_PASSWORD_CODE_PATH, payload);
  return response.data;
};

export const resetForgotPasswordRequest = async (payload: {
  newPassword: string;
  resetToken: string;
}): Promise<{ message?: string }> => {
  const response = await apiClient.post<{ message?: string }>(
    RESET_FORGOT_PASSWORD_PATH,
    { new_password: payload.newPassword },
    {
      headers: {
        Authorization: `Bearer ${payload.resetToken}`,
      },
    },
  );
  return response.data;
};

export interface SavePasswordPayload {
  password: string;
  codeWord: string;
  description: string;
  generationSettings?: Record<string, unknown>;
}

export interface SavedPasswordItem {
  id: string;
  description: string;
  created_at: string;
  password_length: string;
  generation_settings: Record<string, unknown>;
}

interface SavedPasswordsListResponse {
  items: SavedPasswordItem[];
  total: number;
  limit: number;
  offset: number;
}

interface RevealPasswordResponse {
  password: string;
}

export const savePasswordRequest = async (payload: SavePasswordPayload): Promise<SavedPasswordItem> => {
  const response = await apiClient.post<SavedPasswordItem>('/api/passwords', {
    password: payload.password,
    code_word: payload.codeWord,
    description: payload.description,
    generation_settings: payload.generationSettings ?? {},
  });
  return response.data;
};

export const getSavedPasswordsRequest = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<SavedPasswordsListResponse> => {
  const response = await apiClient.get<SavedPasswordsListResponse | SavedPasswordItem[]>('/api/passwords', {
    params,
  });
  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      total: response.data.length,
      limit: params?.limit ?? response.data.length,
      offset: params?.offset ?? 0,
    };
  }
  return response.data;
};

export const getSavedPasswordByIdRequest = async (passwordId: string): Promise<SavedPasswordItem> => {
  const response = await apiClient.get<SavedPasswordItem>(`/api/passwords/${passwordId}`);
  return response.data;
};

export const revealSavedPasswordRequest = async (payload: {
  passwordId: string;
  codeWord: string;
}): Promise<RevealPasswordResponse> => {
  const response = await apiClient.post<RevealPasswordResponse>(`/api/passwords/${payload.passwordId}/reveal`, {
    code_word: payload.codeWord,
  });
  return response.data;
};

export const updateSavedPasswordDescriptionRequest = async (payload: {
  passwordId: string;
  description: string;
}): Promise<{ id: string; description: string; updated_at: string }> => {
  const response = await apiClient.patch<{ id: string; description: string; updated_at: string }>(
    `/api/passwords/${payload.passwordId}`,
    { description: payload.description },
  );
  return response.data;
};

export const deleteSavedPasswordRequest = async (passwordId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/api/passwords/${passwordId}`);
  return response.data;
};
