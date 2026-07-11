import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokenService } from './auth-token.service';

interface AuthResponse {
  accessToken: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  username: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(AuthTokenService);

  readonly isAuthenticated = computed(() => this.tokenService.token() !== null);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.tokenService.setToken(response.accessToken)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((response) => this.tokenService.setToken(response.accessToken)));
  }

  logout(): void {
    this.tokenService.clearToken();
  }
}
