import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';
import { MUSIC_PROVIDER } from './providers/music-provider.interface';
import type { MusicProvider } from './providers/music-provider.interface';
import { StorageService } from './storage.service';
import { Music } from './entities/music.entity';
import { Playlist } from '../playlist/entities/playlist.entity';
import { CreateMusicDto } from './dto/create-music.dto';
import { UpdateMusicDto } from './dto/update-music.dto';
import { SubscriptionService } from '../auth/subscription.service';
import { AlignedWord } from './types/aligned-word';

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);

  constructor(
    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @Inject(MUSIC_PROVIDER)
    private readonly provider: MusicProvider,
    private readonly storage: StorageService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  private async canAccessMusic(music: Music, userId: string): Promise<boolean> {
    if (music.userId === userId) {
      return true;
    }

    const shared = await this.playlistRepo
      .createQueryBuilder('playlist')
      .leftJoin('playlist.musics', 'music')
      .leftJoin('playlist.members', 'member')
      .where('music.id = :musicId', { musicId: music.id })
      .andWhere('(playlist.creatorId = :userId OR member.id = :userId)', {
        userId,
      })
      .getCount();

    return shared > 0;
  }

  async generateAndStore(
    dto: CreateMusicDto,
    userId: string,
  ): Promise<{ id: string; taskId: string }> {
    await this.subscriptionService.assertCanGenerate(userId);

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

    const taskId = await this.provider.generate({
      prompt: dto.lyrics,
      style: dto.style,
      title: dto.title,
      makeInstrumental: dto.makeInstrumental,
    });

    if (!taskId) {
      throw new Error('No taskId returned from kie.ai');
    }

    await this.subscriptionService.consumeGeneration(userId);

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
        this.logger.warn(
          `No music found for taskId ${taskId}, skipping track ${track.id}`,
        );
        continue;
      }

      const objectName = await this.storage.downloadAndStore(
        audioUrl,
        music.userId,
        music.id,
      );

      music.kieTaskId = taskId;
      music.sunoId = track.id;
      music.title = track.title ?? music.title;
      music.duration = track.duration;
      music.objectName = objectName;
      music.publicUrl = this.storage.getPublicUrl(objectName);
      music.status = 'complete';
      music.lyricsStatus = 'pending';

      await this.musicRepo.save(music);
      this.logger.log(`Music "${music.title}" saved — MinIO: ${objectName}`);

      void this.fetchAndStoreAlignedLyrics(music.id).catch((error) =>
        this.logger.warn(
          `Aligned lyrics failed for ${music.id}: ${error.message}`,
        ),
      );
    }
  }

  async fetchAndStoreAlignedLyrics(musicId: string): Promise<void> {
    const music = await this.musicRepo.findOneBy({ id: musicId });
    if (!music || !music.kieTaskId || !music.sunoId) {
      return;
    }

    try {
      const aligned = await this.provider.getTimestampedLyrics(
        music.kieTaskId,
        music.sunoId,
      );
      music.alignedLyrics = aligned;
      music.lyricsStatus = 'failed';
      if (aligned.length > 0) {
        music.lyricsStatus = 'ready';
      }
    } catch {
      music.lyricsStatus = 'failed';
    }

    await this.musicRepo.save(music);
  }

  async retryAlignedLyrics(
    id: string,
    userId: string,
  ): Promise<{
    lyricsStatus: string;
    alignedLyrics: AlignedWord[] | null;
    lyrics: string | null;
  }> {
    const music = await this.findOneByUser(id, userId);
    await this.ensureLyricsIds(music);
    await this.fetchAndStoreAlignedLyrics(music.id);
    return this.getLyrics(id, userId);
  }

  private async ensureLyricsIds(music: Music): Promise<void> {
    if (music.kieTaskId) {
      return;
    }
    if (!music.sunoId) {
      return;
    }

    const taskId = music.sunoId;
    try {
      const { tracks } = await this.provider.getGeneratedTracks(taskId);
      const ready = tracks.find((track) => !!track.id);
      if (!ready) {
        return;
      }
      music.kieTaskId = taskId;
      music.sunoId = ready.id;
      await this.musicRepo.save(music);
    } catch {
      this.logger.warn(`Could not resolve lyrics ids for ${music.id}`);
    }
  }

  async getLyrics(
    id: string,
    userId: string,
  ): Promise<{
    lyricsStatus: string;
    alignedLyrics: AlignedWord[] | null;
    lyrics: string | null;
  }> {
    const music = await this.findOneByUser(id, userId);

    return {
      lyricsStatus: music.lyricsStatus,
      alignedLyrics: music.alignedLyrics,
      lyrics: music.lyrics,
    };
  }

  async findAllByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Music[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.musicRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneByUser(id: string, userId: string): Promise<Music> {
    const music = await this.musicRepo.findOneBy({ id });

    if (!music) {
      throw new NotFoundException(`Music ${id} not found`);
    }

    if (music.userId !== userId) {
      throw new ForbiddenException();
    }

    return music;
  }

  async update(
    id: string,
    dto: UpdateMusicDto,
    userId: string,
  ): Promise<Music> {
    const music = await this.findOneByUser(id, userId);

    if (dto.title) {
      music.title = dto.title;
    }

    if (dto.style) {
      music.style = dto.style;
    }

    if (dto.lyrics) {
      music.lyrics = dto.lyrics;
    }

    return this.musicRepo.save(music);
  }

  async getStreamUrl(id: string, userId: string): Promise<{ url: string }> {
    const music = await this.musicRepo.findOneBy({ id });

    if (!music) {
      throw new NotFoundException(`Music ${id} not found`);
    }

    if (!(await this.canAccessMusic(music, userId))) {
      throw new ForbiddenException();
    }

    const url = await this.storage.getPresignedUrl(music.objectName);
    return { url };
  }

  async getDownload(
    id: string,
    userId: string,
  ): Promise<{ stream: Readable; filename: string }> {
    const music = await this.musicRepo.findOneBy({ id });

    if (!music || !music.objectName) {
      throw new NotFoundException(`Music ${id} not available`);
    }

    if (!(await this.canAccessMusic(music, userId))) {
      throw new ForbiddenException();
    }

    const stream = await this.storage.getObjectStream(music.objectName);
    const safeTitle = (music.title ?? 'musique').replace(/[^\w-]+/g, '_');
    return { stream, filename: `${safeTitle}.mp3` };
  }

  async syncFromKie(id: string, userId: string): Promise<Music> {
    const music = await this.findOneByUser(id, userId);

    if (music.status === 'complete') {
      return music;
    }

    if (!music.sunoId) {
      throw new BadRequestException(
        'No generation task associated with this track',
      );
    }

    const taskId = music.sunoId;
    const { tracks } = await this.provider.getGeneratedTracks(taskId);
    const ready = tracks.find((track) => !!track.audioUrl);

    if (!ready) {
      this.logger.log(`Track ${id} not ready yet on kie.ai`);
      return music;
    }

    await this.storage.ensureBucket();
    const objectName = await this.storage.downloadAndStore(
      ready.audioUrl,
      music.userId,
      music.id,
    );

    music.title = ready.title ?? music.title;
    if (ready.duration !== undefined) {
      music.duration = ready.duration;
    }
    music.objectName = objectName;
    music.publicUrl = this.storage.getPublicUrl(objectName);
    music.status = 'complete';
    music.kieTaskId = taskId;
    music.lyricsStatus = 'pending';
    if (ready.id) {
      music.sunoId = ready.id;
    }

    await this.musicRepo.save(music);
    this.logger.log(`Track ${id} synced from kie.ai — MinIO: ${objectName}`);

    void this.fetchAndStoreAlignedLyrics(music.id).catch((error) =>
      this.logger.warn(
        `Aligned lyrics failed for ${music.id}: ${error.message}`,
      ),
    );

    return music;
  }

  async delete(id: string, userId: string): Promise<void> {
    const music = await this.findOneByUser(id, userId);
    await this.musicRepo.manager.query(
      'DELETE FROM playlist_music WHERE "musicId" = $1',
      [music.id],
    );
    await this.musicRepo.remove(music);
    await this.removeStoredObject(music.objectName);
  }

  private async removeStoredObject(
    objectName: string | undefined,
  ): Promise<void> {
    if (!objectName) {
      return;
    }
    await this.storage.removeObject(objectName).catch(() => undefined);
  }
}
