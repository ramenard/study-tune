import {Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {SunoService} from './suno.service';
import {StorageService} from './storage.service';
import {Music} from './entities/music.entity';
import {CreateMusicDto} from './dto/create-music.dto';

@Injectable()
export class MusicService {
  private readonly logger = new Logger(MusicService.name);

  constructor(
    @InjectRepository(Music)
    private readonly musicRepo: Repository<Music>,
    private readonly suno: SunoService,
    private readonly storage: StorageService,
  ) {
  }

  // Lance la génération et retourne immédiatement le taskId
  async generateAndStore(dto: CreateMusicDto): Promise<{ taskId: string }> {
    const taskId = await this.suno.generate(dto);

    // Vérifie que le taskId n'est pas vide avant de sauvegarder
    if (!taskId) {
      throw new Error('No taskId returned from kie.ai');
    }

    await this.musicRepo.save(
      this.musicRepo.create({
        sunoId: taskId,  // ✅ doit être non-null
        title: 'Generating...',
        prompt: dto.prompt,
        style: dto.style,
        objectName: '',
        publicUrl: '',
      }),
    );

    return {taskId};
  }

// Appelé par kie.ai quand la musique est prête
  async handleKieWebhook(payload: any): Promise<void> {
    this.logger.log(`Webhook received: ${JSON.stringify(payload)}`);

    const callbackType = payload?.data?.callbackType;

    if (callbackType !== 'complete') {
      this.logger.log(`Ignoring intermediate callback: ${callbackType}`);
      return;
    }

    // ✅ Les tracks sont dans payload.data.data[]
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
      const objectName = await this.storage.downloadAndStore(audioUrl, track.id);

      // Cherche l'entrée existante par taskId ou crée une nouvelle
      let music = await this.musicRepo.findOneBy({ sunoId: taskId });

      if (music) {
        music.sunoId = track.id;
        music.title = track.title ?? 'Untitled';
        music.duration = track.duration;
        music.objectName = objectName;
        music.publicUrl = this.storage.getPublicUrl(objectName);
      } else {
        music = this.musicRepo.create({
          sunoId: track.id,
          title: track.title ?? 'Untitled',
          prompt: track.prompt ?? '',
          style: track.tags ?? '',
          duration: track.duration,
          objectName,
          publicUrl: this.storage.getPublicUrl(objectName),
        });
      }

      await this.musicRepo.save(music);
      this.logger.log(`✅ Music "${music.title}" saved — MinIO: ${objectName}`);
    }
  }

  async findAll(): Promise<Music[]> {
    return this.musicRepo.find({order: {createdAt: 'DESC'}});
  }

  async findOne(id: string): Promise<Music> {
    const music = await this.musicRepo.findOneBy({id});
    if (!music) throw new NotFoundException(`Music ${id} not found`);
    return music;
  }

  async getStreamUrl(id: string): Promise<{ url: string }> {
    const music = await this.findOne(id);
    const url = await this.storage.getPresignedUrl(music.objectName);
    return {url};
  }
}