import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

describe('PlaylistService', () => {
  let playlistRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let musicRepo: { findOneBy: jest.Mock };
  let userRepo: { findOneBy: jest.Mock };
  let friendship: { areFriends: jest.Mock };
  let service: PlaylistService;

  beforeEach(() => {
    playlistRepo = {
      create: jest.fn().mockImplementation((v: unknown) => v),
      save: jest.fn().mockImplementation((v: unknown) => Promise.resolve(v)),
      findOne: jest.fn(),
    };
    musicRepo = { findOneBy: jest.fn() };
    userRepo = { findOneBy: jest.fn() };
    friendship = { areFriends: jest.fn() };
    service = new PlaylistService(
      playlistRepo as never,
      musicRepo as never,
      userRepo as never,
      friendship as never,
    );
  });

  it('creates a playlist owned by the current user', async () => {
    await service.create({ name: 'Physique' }, 'u1');

    expect(playlistRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Physique', creatorId: 'u1' }),
    );
  });

  describe('findOneByUser', () => {
    it('throws NotFound when the playlist is missing', async () => {
      playlistRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneByUser('p1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('forbids a user who is neither creator nor member', async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 'p1', creatorId: 'owner', members: [] });

      await expect(service.findOneByUser('p1', 'stranger')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows a member', async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 'p1', creatorId: 'owner', members: [{ id: 'u1' }] });

      await expect(service.findOneByUser('p1', 'u1')).resolves.toMatchObject({ id: 'p1' });
    });
  });

  describe('addMember', () => {
    it('only lets a friend be added to a playlist', async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 'p1', creatorId: 'u1', members: [] });
      userRepo.findOneBy.mockResolvedValue({ id: 'friend' });
      friendship.areFriends.mockResolvedValue(false);

      await expect(service.addMember('p1', 'friend', 'u1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('addMusic', () => {
    it('forbids a member (non-creator) from adding tracks', async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 'p1', creatorId: 'owner', members: [{ id: 'u1' }], musics: [] });

      await expect(service.addMusic('p1', 'm1', 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFound when the music does not exist', async () => {
      playlistRepo.findOne.mockResolvedValue({ id: 'p1', creatorId: 'u1', members: [], musics: [] });
      musicRepo.findOneBy.mockResolvedValue(null);

      await expect(service.addMusic('p1', 'missing', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('adds the music when it exists and is not already present', async () => {
      const playlist = { id: 'p1', creatorId: 'u1', members: [], musics: [] as { id: string }[] };
      playlistRepo.findOne.mockResolvedValue(playlist);
      musicRepo.findOneBy.mockResolvedValue({ id: 'm1' });

      await service.addMusic('p1', 'm1', 'u1');

      expect(playlist.musics).toHaveLength(1);
      expect(playlistRepo.save).toHaveBeenCalled();
    });
  });
});
