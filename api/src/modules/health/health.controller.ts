import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

const HEAP_LIMIT_BYTES = 300 * 1024 * 1024;
const DISK_THRESHOLD_PERCENT = 0.9;
const KIE_PING_URL = 'https://api.kie.ai';
const MISTRAL_PING_URL = 'https://api.mistral.ai';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly http: HttpHealthIndicator,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check(this.readinessChecks());
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      ...this.readinessChecks(),
      () => this.pingExternal('kie', KIE_PING_URL),
      () => this.pingExternal('mistral', MISTRAL_PING_URL),
    ]);
  }

  private readinessChecks() {
    return [
      () => this.db.pingCheck('database'),
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: DISK_THRESHOLD_PERCENT,
        }),
      () => this.memory.checkHeap('memory_heap', HEAP_LIMIT_BYTES),
    ];
  }

  private async pingExternal(
    key: string,
    url: string,
  ): Promise<HealthIndicatorResult> {
    try {
      return await this.http.pingCheck(key, url, {
        validateStatus: () => true,
      });
    } catch {
      return { [key]: { status: 'up', degraded: true } };
    }
  }
}
