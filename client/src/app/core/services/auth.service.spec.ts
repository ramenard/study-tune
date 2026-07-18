import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { ProfileService } from './profile.service';
import { GenerationStatusService } from './generation-status.service';
import { PlayerService } from './player.service';
import { Api } from '@api/api';

describe('AuthService (front)', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let clear: ReturnType<typeof vi.fn>;
  let tokenService: AuthTokenService;
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    invoke = vi.fn().mockResolvedValue(undefined);
    clear = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        { provide: Api, useValue: { invoke } },
        { provide: ProfileService, useValue: { clear } },
        { provide: GenerationStatusService, useValue: { clear: vi.fn() } },
        { provide: PlayerService, useValue: { stop: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    tokenService = TestBed.inject(AuthTokenService);
  });

  it('stores both tokens on login and becomes authenticated', async () => {
    invoke.mockResolvedValue({ accessToken: 'tok-123', refreshToken: 'ref-123' });

    await firstValueFrom(service.login({ email: 'a@b.c', password: 'password123' }));

    expect(tokenService.token()).toBe('tok-123');
    expect(tokenService.refreshToken()).toBe('ref-123');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('rotates the tokens on refresh', async () => {
    tokenService.setTokens('old-access', 'old-refresh');
    invoke.mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    const accessToken = await firstValueFrom(service.refreshAccessToken());

    expect(accessToken).toBe('new-access');
    expect(tokenService.token()).toBe('new-access');
    expect(tokenService.refreshToken()).toBe('new-refresh');
  });

  it('clears the token and profile on logout', () => {
    tokenService.setTokens('tok-123', 'ref-123');

    service.logout();

    expect(tokenService.token()).toBeNull();
    expect(tokenService.refreshToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(clear).toHaveBeenCalled();
  });
});
