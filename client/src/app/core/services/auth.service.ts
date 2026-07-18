import { computed, inject, Injectable } from '@angular/core';
import {
  finalize,
  from,
  map,
  Observable,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { Api } from '@api/api';
import { authControllerLogin } from '@api/fn/auth/auth-controller-login';
import { authControllerRegister } from '@api/fn/auth/auth-controller-register';
import { authControllerRefresh } from '@api/fn/auth/auth-controller-refresh';
import { authControllerLogout } from '@api/fn/auth/auth-controller-logout';
import { authControllerDeleteAccount } from '@api/fn/auth/auth-controller-delete-account';
import { AuthResponseDto } from '@api/models/auth-response-dto';
import { LoginDto } from '@api/models/login-dto';
import { RegisterDto } from '@api/models/register-dto';
import { AuthTokenService } from './auth-token.service';
import { ProfileService } from './profile.service';
import { GenerationStatusService } from './generation-status.service';
import { PlayerService } from './player.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(Api);
  private readonly tokenService = inject(AuthTokenService);
  private readonly profileService = inject(ProfileService);
  private readonly generationStatus = inject(GenerationStatusService);
  private readonly player = inject(PlayerService);

  private refreshInFlight: Observable<string> | null = null;

  readonly isAuthenticated = computed(() => this.tokenService.token() !== null);

  login(payload: LoginDto): Observable<AuthResponseDto> {
    return from(this.api.invoke(authControllerLogin, { body: payload })).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  register(payload: RegisterDto): Observable<AuthResponseDto> {
    return from(this.api.invoke(authControllerRegister, { body: payload })).pipe(
      tap((response) => this.storeTokens(response)),
    );
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokenService.refreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    if (!this.refreshInFlight) {
      this.refreshInFlight = from(
        this.api.invoke(authControllerRefresh, { body: { refreshToken } }),
      ).pipe(
        tap((response) => this.storeTokens(response)),
        map((response) => response.accessToken),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
    }

    return this.refreshInFlight;
  }

  logout(): void {
    void this.api.invoke(authControllerLogout).catch(() => undefined);
    this.clearSession();
  }

  async deleteAccount(): Promise<void> {
    await this.api.invoke(authControllerDeleteAccount);
    this.clearSession();
  }

  clearSession(): void {
    this.tokenService.clearToken();
    this.profileService.clear();
    this.generationStatus.clear();
    this.player.stop();
  }

  private storeTokens(response: AuthResponseDto): void {
    this.tokenService.setTokens(response.accessToken, response.refreshToken);
  }
}
