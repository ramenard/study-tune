import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

const PREMIUM_MONTHLY_GENERATIONS = 2;
const FREE_FIRST_MONTH_GENERATIONS = 2;

export interface SubscriptionStatus {
  user: User;
  monthlyAllowance: number;
  generationsRemaining: number;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getStatus(userId: string): Promise<SubscriptionStatus> {
    const user = await this.loadUserWithReset(userId);
    const monthlyAllowance = this.computeMonthlyAllowance(user, new Date());
    const generationsRemaining = Math.max(
      0,
      monthlyAllowance - user.generationsUsed,
    );
    return { user, monthlyAllowance, generationsRemaining };
  }

  async assertCanGenerate(userId: string): Promise<void> {
    const { generationsRemaining } = await this.getStatus(userId);

    if (generationsRemaining <= 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'NO_GENERATIONS_LEFT',
          message: 'Aucune génération restante pour ton offre actuelle',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  async consumeGeneration(userId: string): Promise<void> {
    const user = await this.loadUserWithReset(userId);
    user.generationsUsed += 1;
    await this.userRepository.save(user);
  }

  async setPlan(userId: string, plan: 'free' | 'premium'): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.plan = plan;

    if (plan === 'premium') {
      user.generationsUsed = 0;
      user.periodStart = new Date();
    }

    await this.userRepository.save(user);
  }

  private async loadUserWithReset(userId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const periodEnd = new Date(user.periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (now >= periodEnd) {
      user.generationsUsed = 0;
      user.periodStart = now;
      await this.userRepository.save(user);
    }

    return user;
  }

  private computeMonthlyAllowance(user: User, now: Date): number {
    if (user.plan === 'premium') {
      return PREMIUM_MONTHLY_GENERATIONS;
    }

    const firstMonthEnd = new Date(user.createdAt);
    firstMonthEnd.setMonth(firstMonthEnd.getMonth() + 1);

    if (now < firstMonthEnd) {
      return FREE_FIRST_MONTH_GENERATIONS;
    }

    return 0;
  }
}
