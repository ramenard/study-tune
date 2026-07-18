import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { SunoService } from './suno.service';
import { StorageService } from './storage.service';
import { KieWebhookGuard } from './kie-webhook.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Music } from './entities/music.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Music, Playlist]),
    AuthModule,
  ],
  controllers: [MusicController],
  providers: [MusicService, SunoService, StorageService, KieWebhookGuard],
})
export class MusicModule {}
