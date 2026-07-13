import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ProfileDto } from './dto/profile.dto';

const PREMIUM_MONTHLY_GENERATIONS = 2;
const FREE_FIRST_MONTH_GENERATIONS = 2;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.userRepository.findOneBy({ email: dto.email });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      password: hashed,
      username: dto.username,
    });
    await this.userRepository.save(user);

    return this.generateToken(user);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'password', 'username'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  async getProfile(userId: string): Promise<ProfileDto> {
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

    const monthlyAllowance = this.computeMonthlyAllowance(user, now);
    const generationsRemaining = Math.max(
      0,
      monthlyAllowance - user.generationsUsed,
    );

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      plan: user.plan,
      createdAt: user.createdAt,
      monthlyAllowance,
      generationsRemaining,
    };
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

  private generateToken(user: User): { accessToken: string } {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken };
  }
}
