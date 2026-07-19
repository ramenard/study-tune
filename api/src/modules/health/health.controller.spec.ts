import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('runs a database ping check', async () => {
    const health = { check: jest.fn().mockResolvedValue({ status: 'ok' }) };
    const db = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };
    const controller = new HealthController(health as never, db as never);

    const result = await controller.check();

    expect(health.check).toHaveBeenCalled();
    expect(result).toEqual({ status: 'ok' });
  });
});
