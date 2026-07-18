import { HttpException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { User } from './entities/user.entity';

type MockRepo = {
  findOneBy: jest.Mock;
  save: jest.Mock;
};

function makeUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: 'user-1',
    email: 'a@b.c',
    password: 'hashed',
    username: 'alice',
    plan: 'free',
    generationsUsed: 0,
    periodStart: now,
    createdAt: now,
    musics: [],
    createdPlaylists: [],
    sharedPlaylists: [],
    ...overrides,
  };
}

describe('SubscriptionService', () => {
  let repo: MockRepo;
  let service: SubscriptionService;

  beforeEach(() => {
    repo = {
      findOneBy: jest.fn(),
      save: jest.fn().mockImplementation((user: User) => Promise.resolve(user)),
    };
    service = new SubscriptionService(repo as never);
  });

  describe('getStatus', () => {
    it('gives a free user 2 generations during the first month', async () => {
      repo.findOneBy.mockResolvedValue(
        makeUser({ plan: 'free', generationsUsed: 0 }),
      );

      const status = await service.getStatus('user-1');

      expect(status.monthlyAllowance).toBe(2);
      expect(status.generationsRemaining).toBe(2);
    });

    it('gives a free user 0 generations after the first month', async () => {
      const created = new Date();
      created.setMonth(created.getMonth() - 2);
      repo.findOneBy.mockResolvedValue(
        makeUser({ plan: 'free', createdAt: created, periodStart: created }),
      );

      const status = await service.getStatus('user-1');

      expect(status.monthlyAllowance).toBe(0);
      expect(status.generationsRemaining).toBe(0);
    });

    it('gives a premium user 2 generations per month', async () => {
      const created = new Date();
      created.setMonth(created.getMonth() - 6);
      repo.findOneBy.mockResolvedValue(
        makeUser({
          plan: 'premium',
          createdAt: created,
          periodStart: new Date(),
          generationsUsed: 1,
        }),
      );

      const status = await service.getStatus('user-1');

      expect(status.monthlyAllowance).toBe(2);
      expect(status.generationsRemaining).toBe(1);
    });

    it('resets the counter when the monthly period has elapsed', async () => {
      const oldPeriod = new Date();
      oldPeriod.setMonth(oldPeriod.getMonth() - 2);
      repo.findOneBy.mockResolvedValue(
        makeUser({
          plan: 'premium',
          periodStart: oldPeriod,
          generationsUsed: 2,
        }),
      );

      const status = await service.getStatus('user-1');

      expect(repo.save).toHaveBeenCalled();
      expect(status.generationsRemaining).toBe(2);
    });
  });

  describe('assertCanGenerate', () => {
    it('throws 402 when no generation remains', async () => {
      repo.findOneBy.mockResolvedValue(
        makeUser({ plan: 'free', generationsUsed: 2 }),
      );

      await expect(service.assertCanGenerate('user-1')).rejects.toBeInstanceOf(
        HttpException,
      );
      await expect(service.assertCanGenerate('user-1')).rejects.toMatchObject({
        status: 402,
      });
    });

    it('passes when a generation is available', async () => {
      repo.findOneBy.mockResolvedValue(
        makeUser({ plan: 'free', generationsUsed: 0 }),
      );

      await expect(
        service.assertCanGenerate('user-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('consumeGeneration', () => {
    it('increments generationsUsed and saves', async () => {
      const user = makeUser({ generationsUsed: 0 });
      repo.findOneBy.mockResolvedValue(user);

      await service.consumeGeneration('user-1');

      expect(user.generationsUsed).toBe(1);
      expect(repo.save).toHaveBeenCalledWith(user);
    });
  });

  describe('setPlan', () => {
    it('resets quota when upgrading to premium', async () => {
      const user = makeUser({ plan: 'free', generationsUsed: 2 });
      repo.findOneBy.mockResolvedValue(user);

      await service.setPlan('user-1', 'premium');

      expect(user.plan).toBe('premium');
      expect(user.generationsUsed).toBe(0);
    });
  });
});
