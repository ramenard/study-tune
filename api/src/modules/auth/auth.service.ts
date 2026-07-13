import {
  ConflictException,
  Injectable,
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
import { SubscriptionService } from './subscription.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly subscriptionService: SubscriptionService,
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

  async subscribe(userId: string): Promise<ProfileDto> {
    await this.subscriptionService.setPlan(userId, 'premium');
    return this.getProfile(userId);
  }

  async unsubscribe(userId: string): Promise<ProfileDto> {
    await this.subscriptionService.setPlan(userId, 'free');
    return this.getProfile(userId);
  }

  async getProfile(userId: string): Promise<ProfileDto> {
    const { user, monthlyAllowance, generationsRemaining } =
      await this.subscriptionService.getStatus(userId);

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

  private generateToken(user: User): { accessToken: string } {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken };
  }
}
