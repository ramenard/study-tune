import { Injectable, signal } from '@angular/core';

const TOKEN_STORAGE_KEY = 'studytune.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  private readonly tokenSignal = signal<string | null>(this.readFromStorage());

  readonly token = this.tokenSignal.asReadonly();

  setToken(token: string): void {
    this.tokenSignal.set(token);
    this.writeToStorage(token);
  }

  clearToken(): void {
    this.tokenSignal.set(null);
    this.removeFromStorage();
  }

  private readFromStorage(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private writeToStorage(token: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  private removeFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}
