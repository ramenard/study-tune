import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('reads the secret from config and maps the payload to a user identity', () => {
    const config = { getOrThrow: jest.fn().mockReturnValue('secret') };
    const strategy = new JwtStrategy(config as never);

    const result = strategy.validate({ sub: 'u1', email: 'a@b.c' });

    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    expect(result).toEqual({ id: 'u1', email: 'a@b.c' });
  });
});
