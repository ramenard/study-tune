import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MusicService } from './music.service';

describe('MusicService', () => {
  let musicRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOneBy: jest.Mock;
    remove: jest.Mock;
    manager: { query: jest.Mock };
  };
  let playlistRepo: { createQueryBuilder: jest.Mock };
  let suno: {
    generate: jest.Mock;
    getGeneratedTracks: jest.Mock;
    getTimestampedLyrics: jest.Mock;
  };
  let storage: {
    getPresignedUrl: jest.Mock;
    ensureBucket: jest.Mock;
    downloadAndStore: jest.Mock;
    getPublicUrl: jest.Mock;
    removeObject: jest.Mock;
  };
  let subscription: {
    assertCanGenerate: jest.Mock;
    consumeGeneration: jest.Mock;
  };
  let service: MusicService;

  beforeEach(() => {
    musicRepo = {
      create: jest.fn().mockImplementation((v: unknown) => v),
      save: jest
        .fn()
        .mockImplementation((v: object) => Promise.resolve({ id: 'm1', ...v })),
      findOneBy: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      manager: { query: jest.fn().mockResolvedValue(undefined) },
    };
    playlistRepo = { createQueryBuilder: jest.fn() };
    suno = {
      generate: jest.fn(),
      getGeneratedTracks: jest.fn(),
      getTimestampedLyrics: jest.fn(),
    };
    storage = {
      getPresignedUrl: jest.fn().mockResolvedValue('http://signed'),
      ensureBucket: jest.fn().mockResolvedValue(undefined),
      downloadAndStore: jest.fn().mockResolvedValue('tracks/u_m1.mp3'),
      getPublicUrl: jest.fn().mockReturnValue('http://public/track'),
      removeObject: jest.fn().mockResolvedValue(undefined),
    };
    subscription = {
      assertCanGenerate: jest.fn(),
      consumeGeneration: jest.fn(),
    };
    service = new MusicService(
      musicRepo as never,
      playlistRepo as never,
      suno,
      storage as never,
      subscription as never,
    );
  });

  describe('generateAndStore', () => {
    it('checks quota before calling Suno', async () => {
      subscription.assertCanGenerate.mockRejectedValue(new Error('402'));

      await expect(
        service.generateAndStore({ lyrics: 'some lyrics here' }, 'u1'),
      ).rejects.toThrow();
      expect(suno.generate).not.toHaveBeenCalled();
      expect(subscription.consumeGeneration).not.toHaveBeenCalled();
    });

    it('consumes a generation only after Suno returns a taskId', async () => {
      subscription.assertCanGenerate.mockResolvedValue(undefined);
      suno.generate.mockResolvedValue('task-1');

      const result = await service.generateAndStore(
        { lyrics: 'some lyrics here', style: 'Lo-fi' },
        'u1',
      );

      expect(subscription.consumeGeneration).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ id: 'm1', taskId: 'task-1' });
    });
  });

  describe('handleKieWebhook', () => {
    it('ignores intermediate callbacks', async () => {
      await service.handleKieWebhook({ data: { callbackType: 'text' } });

      expect(storage.ensureBucket).not.toHaveBeenCalled();
    });

    it('downloads and completes the track on a complete callback', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        title: 'old',
      });

      await service.handleKieWebhook({
        data: {
          callbackType: 'complete',
          task_id: 'task-1',
          data: [
            {
              id: 't1',
              title: 'Song',
              audio_url: 'http://a/1.mp3',
              duration: 90,
            },
          ],
        },
      });

      expect(storage.downloadAndStore).toHaveBeenCalled();
      expect(musicRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'complete',
          objectName: 'tracks/u_m1.mp3',
        }),
      );
    });
  });

  describe('fetchAndStoreAlignedLyrics', () => {
    it('does nothing when the track has no kieTaskId', async () => {
      musicRepo.findOneBy.mockResolvedValue({ id: 'm1', sunoId: 'audio-1' });

      await service.fetchAndStoreAlignedLyrics('m1');

      expect(suno.getTimestampedLyrics).not.toHaveBeenCalled();
      expect(musicRepo.save).not.toHaveBeenCalled();
    });

    it('marks the track as failed when the alignment is empty', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        kieTaskId: 'task-1',
        sunoId: 'audio-1',
      });
      suno.getTimestampedLyrics.mockResolvedValue([]);

      await service.fetchAndStoreAlignedLyrics('m1');

      expect(musicRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lyricsStatus: 'failed' }),
      );
    });

    it('persists the alignment and marks the track ready', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        kieTaskId: 'task-1',
        sunoId: 'audio-1',
      });
      const aligned = [{ word: 'Hi', startS: 0, endS: 1, success: true }];
      suno.getTimestampedLyrics.mockResolvedValue(aligned);

      await service.fetchAndStoreAlignedLyrics('m1');

      expect(musicRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lyricsStatus: 'ready',
          alignedLyrics: aligned,
        }),
      );
    });

    it('marks the track as failed when the provider throws', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        kieTaskId: 'task-1',
        sunoId: 'audio-1',
      });
      suno.getTimestampedLyrics.mockRejectedValue(new Error('boom'));

      await service.fetchAndStoreAlignedLyrics('m1');

      expect(musicRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lyricsStatus: 'failed' }),
      );
    });
  });

  describe('findOneByUser', () => {
    it('throws NotFound when the track does not exist', async () => {
      musicRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOneByUser('x', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('forbids access to another user track', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'x',
        userId: 'someone-else',
      });

      await expect(service.findOneByUser('x', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('returns the track for its owner', async () => {
      musicRepo.findOneBy.mockResolvedValue({ id: 'x', userId: 'u1' });

      await expect(service.findOneByUser('x', 'u1')).resolves.toEqual({
        id: 'x',
        userId: 'u1',
      });
    });
  });

  describe('syncFromKie', () => {
    it('returns immediately when already complete', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        status: 'complete',
      });

      const result = await service.syncFromKie('m1', 'u1');

      expect(suno.getGeneratedTracks).not.toHaveBeenCalled();
      expect(result.status).toBe('complete');
    });

    it('downloads a ready track and marks it complete', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        status: 'generating',
        sunoId: 'task-1',
      });
      suno.getGeneratedTracks.mockResolvedValue({
        tracks: [{ audioUrl: 'http://a/1.mp3', title: 'Song', duration: 90 }],
      });

      const result = await service.syncFromKie('m1', 'u1');

      expect(storage.downloadAndStore).toHaveBeenCalled();
      expect(result.status).toBe('complete');
    });
  });

  describe('getStreamUrl', () => {
    it('returns a presigned url for the owner', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'm1',
        userId: 'u1',
        objectName: 'tracks/u_m1.mp3',
      });

      await expect(service.getStreamUrl('m1', 'u1')).resolves.toEqual({
        url: 'http://signed',
      });
    });
  });

  describe('delete', () => {
    it('cleans up join rows, removes the track and its stored object', async () => {
      musicRepo.findOneBy.mockResolvedValue({
        id: 'x',
        userId: 'u1',
        objectName: 'tracks/u_x.mp3',
      });

      await service.delete('x', 'u1');

      expect(musicRepo.manager.query).toHaveBeenCalledWith(
        'DELETE FROM playlist_music WHERE "musicId" = $1',
        ['x'],
      );
      expect(musicRepo.remove).toHaveBeenCalled();
      expect(storage.removeObject).toHaveBeenCalledWith('tracks/u_x.mp3');
    });
  });
});
