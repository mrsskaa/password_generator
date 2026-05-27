import axios from 'axios';
import type { loginFormData } from '../schemas/loginSchema';
import type { registerFormData } from '../schemas/regSchema';
import type { User } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

axios.defaults.withCredentials = true;

const FORGOT_PASSWORD_PATH = import.meta.env.VITE_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/forgot-password';
const FORGOT_PASSWORD_CONFIRM_PATH =
  import.meta.env.VITE_FORGOT_PASSWORD_CONFIRM_ENDPOINT ?? '/api/auth/verify-code';
const RESEND_FORGOT_PASSWORD_CODE_PATH =
  import.meta.env.VITE_RESEND_FORGOT_PASSWORD_CODE_ENDPOINT ?? '/api/auth/forgot-password/resend-code';
const RESET_FORGOT_PASSWORD_PATH = import.meta.env.VITE_RESET_FORGOT_PASSWORD_ENDPOINT ?? '/api/auth/reset-password';
const REGISTER_CONFIRM_PATH = import.meta.env.VITE_REGISTER_CONFIRM_ENDPOINT ?? '/api/auth/register/verify-code';
const RESEND_REGISTER_CODE_PATH =
  import.meta.env.VITE_RESEND_REGISTER_CODE_ENDPOINT ?? '/api/auth/register/resend-code';

export function mapBackendUser(raw: unknown): User {
  const u = raw as Record<string, unknown>;
  return {
    id: String(u.id),
    username: String(u.username ?? ''),
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
  user: unknown | null;
}

export const registerRequest = async (payload: registerFormData): Promise<{ message: string; user: User | null }> => {
  const response = await axios.post<RegisterResponseBody>(`${API_URL}/api/auth/register`, {
    username: payload.email,
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
    const res = await axios.get<unknown>(`${API_URL}/api/users/me`);
    return mapBackendUser(res.data);
  } catch {
    return null;
  }
}

export async function logoutRequest(): Promise<void> {
  await axios.post(`${API_URL}/api/auth/logout`);
}

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
}): Promise<{ message?: string; reset_token?: string }> => {
  const response = await axios.post<{ message?: string; reset_token?: string }>(
    `${API_URL}${FORGOT_PASSWORD_CONFIRM_PATH}`,
    payload,
  );
  return response.data;
};

export const resendForgotPasswordCodeRequest = async (payload: { email: string }): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(`${API_URL}${RESEND_FORGOT_PASSWORD_CODE_PATH}`, payload);
  return response.data;
};

export const resetForgotPasswordRequest = async (payload: {
  newPassword: string;
  resetToken: string;
}): Promise<{ message?: string }> => {
  const response = await axios.post<{ message?: string }>(
    `${API_URL}${RESET_FORGOT_PASSWORD_PATH}`,
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
  settings_preview: string;
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
  const response = await axios.post<SavedPasswordItem>(`${API_URL}/api/passwords`, {
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
  const response = await axios.get<SavedPasswordsListResponse | SavedPasswordItem[]>(`${API_URL}/api/passwords`, {
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
  const response = await axios.get<SavedPasswordItem>(`${API_URL}/api/passwords/${passwordId}`);
  return response.data;
};

export const revealSavedPasswordRequest = async (payload: {
  passwordId: string;
  codeWord: string;
}): Promise<RevealPasswordResponse> => {
  const response = await axios.post<RevealPasswordResponse>(`${API_URL}/api/passwords/${payload.passwordId}/reveal`, {
    code_word: payload.codeWord,
  });
  return response.data;
};

export const updateSavedPasswordDescriptionRequest = async (payload: {
  passwordId: string;
  description: string;
}): Promise<{ id: string; description: string; updated_at: string }> => {
  const response = await axios.patch<{ id: string; description: string; updated_at: string }>(
    `${API_URL}/api/passwords/${payload.passwordId}`,
    { description: payload.description },
  );
  return response.data;
};

export const deleteSavedPasswordRequest = async (passwordId: string): Promise<{ message: string }> => {
  const response = await axios.delete<{ message: string }>(`${API_URL}/api/passwords/${passwordId}`);
  return response.data;
};


