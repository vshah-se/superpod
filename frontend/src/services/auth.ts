import { apiClient } from '../api/client';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/api';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

class AuthService {
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('superpod-auth');
    if (stored) {
      try {
        this.authState = JSON.parse(stored);
        if (this.authState.accessToken) {
          apiClient.setAccessToken(this.authState.accessToken);
        }
      } catch (error) {
        console.error('Failed to load auth state from storage:', error);
        this.clearAuth();
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem('superpod-auth', JSON.stringify(this.authState));
  }

  private clearAuth() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    localStorage.removeItem('superpod-auth');
    apiClient.setAccessToken(null);
  }

  async login(credentials: LoginRequest): Promise<void> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

    this.authState = {
      isAuthenticated: true,
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    apiClient.setAccessToken(response.accessToken);
    this.saveToStorage();
  }

  async register(userData: RegisterRequest): Promise<void> {
    const response = await apiClient.post<LoginResponse>('/auth/register', userData);

    this.authState = {
      isAuthenticated: true,
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    apiClient.setAccessToken(response.accessToken);
    this.saveToStorage();
  }

  async refreshToken(): Promise<void> {
    if (!this.authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken: this.authState.refreshToken,
    });

    this.authState.accessToken = response.accessToken;
    this.authState.expiresAt = Date.now() + response.expiresIn * 1000;

    apiClient.setAccessToken(response.accessToken);
    this.saveToStorage();
  }

  async logout(): Promise<void> {
    this.clearAuth();
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isTokenExpired(): boolean {
    if (!this.authState.expiresAt) return true;
    return Date.now() >= this.authState.expiresAt - 60000; // 1 minute buffer
  }

  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired() && this.authState.refreshToken) {
      await this.refreshToken();
    }
  }
}

export const authService = new AuthService();
export type { AuthState };