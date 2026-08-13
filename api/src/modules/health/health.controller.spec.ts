import { HealthController } from './health.controller';

describe('HealthController', () => {
  const buildController = () => {
    const health = { check: jest.fn().mockResolvedValue({ status: 'ok' }) };
    const db = {
      pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
    };
    const disk = {
      checkStorage: jest.fn().mockResolvedValue({ disk: { status: 'up' } }),
    };
    const memory = {
      checkHeap: jest.fn().mockResolvedValue({ memory_heap: { status: 'up' } }),
    };
    const http = {
      pingCheck: jest.fn().mockResolvedValue({ kie: { status: 'up' } }),
    };
    const controller = new HealthController(
      health as never,
      db as never,
      disk as never,
      memory as never,
      http as never,
    );

    return { controller, health, db, disk, memory, http };
  };

  it('reports liveness without touching any external check', () => {
    const { controller, health } = buildController();

    expect(controller.live()).toEqual({ status: 'ok' });
    expect(health.check).not.toHaveBeenCalled();
  });

  it('checks database, disk and memory for readiness', async () => {
    const { controller, health, db, disk, memory } = buildController();

    const result = await controller.ready();
    const checks = health.check.mock.calls[0][0];
    await Promise.all(checks.map((run: () => unknown) => run()));

    expect(result).toEqual({ status: 'ok' });
    expect(db.pingCheck).toHaveBeenCalledWith('database');
    expect(disk.checkStorage).toHaveBeenCalled();
    expect(memory.checkHeap).toHaveBeenCalled();
  });

  it('stays up and flags degradation when an external dependency is down', async () => {
    const { controller, health, http } = buildController();
    http.pingCheck.mockRejectedValue(new Error('ECONNREFUSED'));

    await controller.check();
    const checks = health.check.mock.calls[0][0];
    const results = await Promise.all(
      checks.map((run: () => unknown) => run()),
    );

    expect(results).toContainEqual({ kie: { status: 'up', degraded: true } });
    expect(results).toContainEqual({
      mistral: { status: 'up', degraded: true },
    });
  });
});
