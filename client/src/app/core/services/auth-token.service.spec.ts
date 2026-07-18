import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no tokens', () => {
    const service = new AuthTokenService();
    expect(service.token()).toBeNull();
    expect(service.refreshToken()).toBeNull();
  });

  it('persists both tokens and exposes them via signals', () => {
    const service = new AuthTokenService();
    service.setTokens('access', 'refresh');

    expect(service.token()).toBe('access');
    expect(service.refreshToken()).toBe('refresh');
    expect(localStorage.getItem('studytune.accessToken')).toBe('access');
    expect(localStorage.getItem('studytune.refreshToken')).toBe('refresh');
  });

  it('reads existing tokens from storage on construction', () => {
    localStorage.setItem('studytune.accessToken', 'stored-access');
    localStorage.setItem('studytune.refreshToken', 'stored-refresh');
    const service = new AuthTokenService();

    expect(service.token()).toBe('stored-access');
    expect(service.refreshToken()).toBe('stored-refresh');
  });

  it('clears both tokens', () => {
    const service = new AuthTokenService();
    service.setTokens('access', 'refresh');
    service.clearToken();

    expect(service.token()).toBeNull();
    expect(service.refreshToken()).toBeNull();
    expect(localStorage.getItem('studytune.accessToken')).toBeNull();
    expect(localStorage.getItem('studytune.refreshToken')).toBeNull();
  });
});
