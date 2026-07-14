import { computed, inject, Injectable } from '@angular/core';
import { from, Observable, tap } from 'rxjs';
import { Api } from '../../api/api';
import { authControllerLogin } from '../../api/fn/auth/auth-controller-login';
import { authControllerRegister } from '../../api/fn/auth/auth-controller-register';
import { AuthResponseDto } from '../../api/models/auth-response-dto';
import { LoginDto } from '../../api/models/login-dto';
import { RegisterDto } from '../../api/models/register-dto';
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

  readonly isAuthenticated = computed(() => this.tokenService.token() !== null);

  login(payload: LoginDto): Observable<AuthResponseDto> {
    return from(this.api.invoke(authControllerLogin, { body: payload })).pipe(
      tap((response) => this.tokenService.setToken(response.accessToken)),
    );
  }

  register(payload: RegisterDto): Observable<AuthResponseDto> {
    return from(this.api.invoke(authControllerRegister, { body: payload })).pipe(
      tap((response) => this.tokenService.setToken(response.accessToken)),
    );
  }

  logout(): void {
    this.tokenService.clearToken();
    this.profileService.clear();
    this.generationStatus.clear();
    this.player.stop();
  }
}
