import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class KieWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('KIE_WEBHOOK_SECRET');

    if (!expected) {
      throw new UnauthorizedException('Webhook secret not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.params.secret;

    if (provided !== expected) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
