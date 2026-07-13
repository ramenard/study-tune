import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  remove: jest.Mock;
};

function makeRepo(): MockRepo {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn().mockImplementation((v: unknown) => v),
    save: jest.fn().mockImplementation((v: unknown) => Promise.resolve(v)),
    remove: jest.fn().mockImplementation((v: unknown) => Promise.resolve(v)),
  };
}

describe('FriendshipService', () => {
  let friendshipRepo: MockRepo;
  let userRepo: MockRepo;
  let service: FriendshipService;

  beforeEach(() => {
    friendshipRepo = makeRepo();
    userRepo = makeRepo();
    service = new FriendshipService(friendshipRepo as never, userRepo as never);
  });

  describe('searchUsers', () => {
    it('returns an empty list for a blank query without hitting the repo', async () => {
      const result = await service.searchUsers('   ', 'me');

      expect(result).toEqual([]);
      expect(userRepo.find).not.toHaveBeenCalled();
    });

    it('marks a user as request_sent when the current user is the requester', async () => {
      userRepo.find.mockResolvedValue([{ id: 'other', username: 'bob' }]);
      friendshipRepo.find.mockResolvedValue([
        { requesterId: 'me', addresseeId: 'other', status: FriendshipStatus.PENDING },
      ]);

      const [result] = await service.searchUsers('bob', 'me');

      expect(result).toEqual({ id: 'other', username: 'bob', relationship: 'request_sent' });
    });

    it('marks a user as friends when an accepted friendship exists', async () => {
      userRepo.find.mockResolvedValue([{ id: 'other', username: 'bob' }]);
      friendshipRepo.find.mockResolvedValue([
        { requesterId: 'other', addresseeId: 'me', status: FriendshipStatus.ACCEPTED },
      ]);

      const [result] = await service.searchUsers('bob', 'me');

      expect(result.relationship).toBe('friends');
    });

    it('marks a user as request_received when they sent a pending request', async () => {
      userRepo.find.mockResolvedValue([{ id: 'other', username: 'bob' }]);
      friendshipRepo.find.mockResolvedValue([
        { requesterId: 'other', addresseeId: 'me', status: FriendshipStatus.PENDING },
      ]);

      const [result] = await service.searchUsers('bob', 'me');

      expect(result.relationship).toBe('request_received');
    });
  });

  describe('sendRequest', () => {
    it('rejects a request to oneself', async () => {
      await expect(service.sendRequest({ addresseeId: 'me' }, 'me')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when a friendship already exists', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'other' });
      friendshipRepo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.sendRequest({ addresseeId: 'other' }, 'me')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('creates a pending request otherwise', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'other' });
      friendshipRepo.findOne.mockResolvedValue(null);

      await service.sendRequest({ addresseeId: 'other' }, 'me');

      expect(friendshipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ requesterId: 'me', addresseeId: 'other', status: FriendshipStatus.PENDING }),
      );
    });
  });

  describe('respondToRequest', () => {
    const pending: Friendship = {
      id: 'f1',
      requesterId: 'other',
      addresseeId: 'me',
      status: FriendshipStatus.PENDING,
    } as Friendship;

    it('forbids responding to a request addressed to someone else', async () => {
      friendshipRepo.findOne = jest.fn();
      friendshipRepo.findOneBy.mockResolvedValue({ ...pending, addresseeId: 'someone-else' });

      await expect(
        service.respondToRequest('f1', { status: FriendshipStatus.ACCEPTED }, 'me'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('removes the friendship row when declined', async () => {
      friendshipRepo.findOneBy.mockResolvedValue({ ...pending });

      await service.respondToRequest('f1', { status: FriendshipStatus.DECLINED }, 'me');

      expect(friendshipRepo.remove).toHaveBeenCalled();
      expect(friendshipRepo.save).not.toHaveBeenCalled();
    });

    it('saves an accepted friendship', async () => {
      friendshipRepo.findOneBy.mockResolvedValue({ ...pending });

      await service.respondToRequest('f1', { status: FriendshipStatus.ACCEPTED }, 'me');

      expect(friendshipRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: FriendshipStatus.ACCEPTED }),
      );
    });

    it('throws when the request does not exist', async () => {
      friendshipRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.respondToRequest('missing', { status: FriendshipStatus.ACCEPTED }, 'me'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
