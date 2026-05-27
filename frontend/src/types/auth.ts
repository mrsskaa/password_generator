/** Совпадает с `UserPublic` на бэкенде */
export interface User {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginLoading: boolean;
  loginError: string | null;
  isRegistering: boolean;
  registerError: string | null;
  registerSuccess: boolean;
}
