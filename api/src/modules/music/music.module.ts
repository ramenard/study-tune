import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { SunoService } from './suno.service';
import { MUSIC_PROVIDER } from './providers/music-provider.interface';
import { StorageModule } from './storage.module';
import { KieWebhookGuard } from './kie-webhook.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Music } from './entities/music.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { AuthModule } from '../auth/auth.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    HttpModule,
    StorageModule,
    TypeOrmModule.forFeature([Music, Playlist]),
    AuthModule,
    ModerationModule,
  ],
  controllers: [MusicController],
  providers: [
    MusicService,
    { provide: MUSIC_PROVIDER, useClass: SunoService },
    KieWebhookGuard,
  ],
})
export class MusicModule {}
