import { UnauthorizedException } from '@nestjs/common';
import { KieWebhookGuard } from './kie-webhook.guard';

function contextWith(secret: unknown): never {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params: { secret } }),
    }),
  } as never;
}

describe('KieWebhookGuard', () => {
  it('throws when no secret is configured', () => {
    const guard = new KieWebhookGuard({ get: () => undefined } as never);

    expect(() => guard.canActivate(contextWith('x'))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the provided secret is wrong', () => {
    const guard = new KieWebhookGuard({ get: () => 'expected' } as never);

    expect(() => guard.canActivate(contextWith('wrong'))).toThrow(
      UnauthorizedException,
    );
  });

  it('passes when the provided secret matches', () => {
    const guard = new KieWebhookGuard({ get: () => 'expected' } as never);

    expect(guard.canActivate(contextWith('expected'))).toBe(true);
  });
});
