import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { SubscriptionService } from './subscription.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from './entities/user.entity';
import { Music } from '../music/entities/music.entity';
import { StorageModule } from '../music/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Music]),
    StorageModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountService, SubscriptionService, JwtStrategy],
  exports: [JwtStrategy, SubscriptionService],
})
export class AuthModule {}
