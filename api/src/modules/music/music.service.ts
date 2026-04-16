import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SunoService } from './suno.service';
import { StorageService } from './storage.service';
import { Music } from './entities/music.entity';
import { CreateMusicDto } from './dto/create-music.dto';

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);

  constructor(
    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,
    private readonly suno: SunoService,
    private readonly storage: StorageService,
  ) {}

  async generateAndStore(dto: CreateMusicDto, userId: string): Promise<{ id: string; taskId: string }> {
    const music = await this.musicRepo.save(
      this.musicRepo.create({
        title: dto.title ?? 'Generating...',
        lyrics: dto.lyrics,
        prompt: dto.lyrics,
        style: dto.style,
        userId,
        status: 'pending',
      }),
    );

    const taskId = await this.suno.generate({
      prompt: dto.lyrics,
      style: dto.style,
      title: dto.title,
      makeInstrumental: dto.makeInstrumental,
    });

    if (!taskId) {
      throw new Error('No taskId returned from kie.ai');
    }

    music.sunoId = taskId;
    music.status = 'generating';
    await this.musicRepo.save(music);

    return { id: music.id, taskId };
  }

  async handleKieWebhook(payload: any): Promise<void> {
    this.logger.log(`Webhook received: ${JSON.stringify(payload)}`);

    const callbackType = payload?.data?.callbackType;

    if (callbackType !== 'complete') {
      this.logger.log(`Ignoring intermediate callback: ${callbackType}`);
      return;
    }

    const tracks = payload?.data?.data ?? [];
    const taskId = payload?.data?.task_id;

    if (!tracks.length) {
      this.logger.warn('No tracks in webhook payload');
      return;
    }

    await this.storage.ensureBucket();

    for (const track of tracks) {
      const audioUrl = track.audio_url ?? track.audioUrl;
      if (!audioUrl) {
        this.logger.warn(`No audioUrl for track ${track.id}, skipping`);
        continue;
      }

      this.logger.log(`Downloading track: ${track.id}`);

      const music = await this.musicRepo.findOneBy({ sunoId: taskId });

      if (!music) {
        this.logger.warn(`No music found for taskId ${taskId}, skipping track ${track.id}`);
        continue;
      }

      const objectName = await this.storage.downloadAndStore(audioUrl, music.userId, music.id);

      music.sunoId = track.id;
      music.title = track.title ?? music.title;
      music.duration = track.duration;
      music.objectName = objectName;
      music.publicUrl = this.storage.getPublicUrl(objectName);
      music.status = 'complete';

      await this.musicRepo.save(music);
      this.logger.log(`Music "${music.title}" saved — MinIO: ${objectName}`);
    }
  }

  async findAll(): Promise<Music[]> {
    return this.musicRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Music> {
    const music = await this.musicRepo.findOneBy({ id });
    if (!music) throw new NotFoundException(`Music ${id} not found`);
    return music;
  }

  async getStreamUrl(id: string): Promise<{ url: string }> {
    const music = await this.findOne(id);
    const url = await this.storage.getPresignedUrl(music.objectName);
    return { url };
  }
}