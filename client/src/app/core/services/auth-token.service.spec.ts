import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no token', () => {
    const service = new AuthTokenService();
    expect(service.token()).toBeNull();
  });

  it('persists a token and exposes it via the signal', () => {
    const service = new AuthTokenService();
    service.setToken('abc');

    expect(service.token()).toBe('abc');
    expect(localStorage.getItem('studytune.accessToken')).toBe('abc');
  });

  it('reads an existing token from storage on construction', () => {
    localStorage.setItem('studytune.accessToken', 'stored');
    const service = new AuthTokenService();

    expect(service.token()).toBe('stored');
  });

  it('clears the token', () => {
    const service = new AuthTokenService();
    service.setToken('abc');
    service.clearToken();

    expect(service.token()).toBeNull();
    expect(localStorage.getItem('studytune.accessToken')).toBeNull();
  });
});
