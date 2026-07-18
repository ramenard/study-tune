import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MusicModule } from './modules/music/music.module';
import { DocumentModule } from './modules/document/document.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { FriendshipModule } from './modules/friendship/friendship.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    MusicModule,
    DocumentModule,
    AuthModule,
    PlaylistModule,
    FriendshipModule,
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().default('user'),
        DB_PASSWORD: Joi.string().default('password'),
        DB_NAME: Joi.string().default('musicdb'),
        JWT_SECRET: Joi.string().required(),
        CORS_ORIGIN: Joi.string().optional(),
        APP_PUBLIC_URL: Joi.string().uri().optional(),
        KIE_API_KEY: Joi.string().optional(),
        KIE_WEBHOOK_SECRET: Joi.string().optional(),
        MISTRAL_API_KEY: Joi.string().optional(),
        MINIO_ENDPOINT: Joi.string().optional(),
        MINIO_PORT: Joi.number().optional(),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_BUCKET: Joi.string().optional(),
        MINIO_PUBLIC_URL: Joi.string().optional(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'user'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_NAME', 'musicdb'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: config.get('NODE_ENV') === 'production',
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
