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
  let suno: { generate: jest.Mock };
  let storage: { getPresignedUrl: jest.Mock };
  let subscription: { assertCanGenerate: jest.Mock; consumeGeneration: jest.Mock };
  let service: MusicService;

  beforeEach(() => {
    musicRepo = {
      create: jest.fn().mockImplementation((v: unknown) => v),
      save: jest.fn().mockImplementation((v: object) => Promise.resolve({ id: 'm1', ...v })),
      findOneBy: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      manager: { query: jest.fn().mockResolvedValue(undefined) },
    };
    playlistRepo = { createQueryBuilder: jest.fn() };
    suno = { generate: jest.fn() };
    storage = { getPresignedUrl: jest.fn() };
    subscription = { assertCanGenerate: jest.fn(), consumeGeneration: jest.fn() };
    service = new MusicService(
      musicRepo as never,
      playlistRepo as never,
      suno as never,
      storage as never,
      subscription as never,
    );
  });

  describe('generateAndStore', () => {
    it('checks quota before calling Suno', async () => {
      subscription.assertCanGenerate.mockRejectedValue(new Error('402'));

      await expect(service.generateAndStore({ lyrics: 'some lyrics here' }, 'u1')).rejects.toThrow();
      expect(suno.generate).not.toHaveBeenCalled();
      expect(subscription.consumeGeneration).not.toHaveBeenCalled();
    });

    it('consumes a generation only after Suno returns a taskId', async () => {
      subscription.assertCanGenerate.mockResolvedValue(undefined);
      suno.generate.mockResolvedValue('task-1');

      const result = await service.generateAndStore({ lyrics: 'some lyrics here', style: 'Lo-fi' }, 'u1');

      expect(subscription.consumeGeneration).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ id: 'm1', taskId: 'task-1' });
    });
  });

  describe('findOneByUser', () => {
    it('throws NotFound when the track does not exist', async () => {
      musicRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOneByUser('x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids access to another user track', async () => {
      musicRepo.findOneBy.mockResolvedValue({ id: 'x', userId: 'someone-else' });

      await expect(service.findOneByUser('x', 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns the track for its owner', async () => {
      musicRepo.findOneBy.mockResolvedValue({ id: 'x', userId: 'u1' });

      await expect(service.findOneByUser('x', 'u1')).resolves.toEqual({ id: 'x', userId: 'u1' });
    });
  });

  describe('delete', () => {
    it('cleans up playlist join rows before removing the track', async () => {
      musicRepo.findOneBy.mockResolvedValue({ id: 'x', userId: 'u1' });

      await service.delete('x', 'u1');

      expect(musicRepo.manager.query).toHaveBeenCalledWith(
        'DELETE FROM playlist_music WHERE "musicId" = $1',
        ['x'],
      );
      expect(musicRepo.remove).toHaveBeenCalled();
    });
  });
});
