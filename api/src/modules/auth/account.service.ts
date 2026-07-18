import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Music } from '../music/entities/music.entity';
import { StorageService } from '../music/storage.service';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Music)
    private readonly musicRepository: Repository<Music>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    const musics = await this.musicRepository.find({
      where: { userId },
      select: ['id', 'objectName'],
    });

    const musicIds = musics.map((music) => music.id);
    const objectNames = musics
      .map((music) => music.objectName)
      .filter((name): name is string => !!name);

    await this.dataSource.transaction(async (manager) => {
      if (musicIds.length > 0) {
        await manager.query(
          'DELETE FROM playlist_music WHERE "musicId" = ANY($1)',
          [musicIds],
        );
        await manager.query('DELETE FROM music WHERE "userId" = $1', [userId]);
      }

      const playlists: { id: string }[] = await manager.query(
        'SELECT id FROM playlist WHERE "creatorId" = $1',
        [userId],
      );
      const playlistIds = playlists.map((playlist) => playlist.id);

      if (playlistIds.length > 0) {
        await manager.query(
          'DELETE FROM playlist_music WHERE "playlistId" = ANY($1)',
          [playlistIds],
        );
        await manager.query(
          'DELETE FROM playlist_members WHERE "playlistId" = ANY($1)',
          [playlistIds],
        );
        await manager.query('DELETE FROM playlist WHERE "creatorId" = $1', [
          userId,
        ]);
      }

      await manager.query('DELETE FROM playlist_members WHERE "userId" = $1', [
        userId,
      ]);
      await manager.query(
        'DELETE FROM friendship WHERE "requesterId" = $1 OR "addresseeId" = $1',
        [userId],
      );
      await manager.query('DELETE FROM "user" WHERE id = $1', [userId]);
    });

    await this.removeObjects(objectNames);
  }

  private async removeObjects(objectNames: string[]): Promise<void> {
    for (const objectName of objectNames) {
      try {
        await this.storageService.removeObject(objectName);
      } catch (error) {
        this.logger.warn(
          `Failed to remove object ${objectName}: ${String(error)}`,
        );
      }
    }
  }
}
