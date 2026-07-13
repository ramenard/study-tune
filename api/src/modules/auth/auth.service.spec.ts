import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let userRepo: { findOneBy: jest.Mock; findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let subscriptionService: { getStatus: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    userRepo = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((v: unknown) => v),
      save: jest.fn().mockImplementation((v: unknown) => Promise.resolve(v)),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    subscriptionService = { getStatus: jest.fn() };
    service = new AuthService(userRepo as never, jwtService as never, subscriptionService as never);
  });

  describe('register', () => {
    it('rejects an already used email', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'a@b.c', password: 'password123', username: 'al' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and returns a token', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);

      const result = await service.register({ email: 'a@b.c', password: 'password123', username: 'al' });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed' }));
      expect(result).toEqual({ accessToken: 'signed-token' });
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.login({ email: 'x@y.z', password: 'password123' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u', email: 'a@b.c', password: 'hashed' });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login({ email: 'a@b.c', password: 'nope' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns a token on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u', email: 'a@b.c', password: 'hashed' });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({ email: 'a@b.c', password: 'password123' });

      expect(result).toEqual({ accessToken: 'signed-token' });
    });
  });
});
