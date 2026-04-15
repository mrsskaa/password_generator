export interface User {
  id: number;
  email: string;
  name: string;
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
