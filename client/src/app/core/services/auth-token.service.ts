import { Injectable, signal } from '@angular/core';

const TOKEN_STORAGE_KEY = 'studytune.accessToken';
const REFRESH_TOKEN_STORAGE_KEY = 'studytune.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly tokenSignal = signal<string | null>(
    this.readFromStorage(TOKEN_STORAGE_KEY),
  );
  private readonly refreshTokenSignal = signal<string | null>(
    this.readFromStorage(REFRESH_TOKEN_STORAGE_KEY),
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();

  setTokens(accessToken: string, refreshToken: string): void {
    this.tokenSignal.set(accessToken);
    this.refreshTokenSignal.set(refreshToken);
    this.writeToStorage(TOKEN_STORAGE_KEY, accessToken);
    this.writeToStorage(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  clearToken(): void {
    this.tokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.removeFromStorage(TOKEN_STORAGE_KEY);
    this.removeFromStorage(REFRESH_TOKEN_STORAGE_KEY);
  }

  private readFromStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(key);
  }

  private writeToStorage(key: string, value: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(key, value);
  }

  private removeFromStorage(key: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(key);
  }
}
