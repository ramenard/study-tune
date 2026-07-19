import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let userRepo: {
    findOneBy: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };
  let subscriptionService: { getStatus: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    userRepo = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((v: unknown) => v),
      save: jest.fn().mockImplementation((v: unknown) => Promise.resolve(v)),
      update: jest.fn().mockResolvedValue(undefined),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('refresh-secret'),
      getOrThrow: jest.fn().mockReturnValue('secret'),
    };
    subscriptionService = { getStatus: jest.fn() };
    service = new AuthService(
      userRepo as never,
      jwtService as never,
      configService as never,
      subscriptionService as never,
    );
  });

  describe('register', () => {
    it('rejects an already used email', async () => {
      userRepo.findOneBy.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'a@b.c',
          password: 'password123',
          username: 'al',
          consent: true,
          birthDate: '2000-01-01',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and returns access + refresh tokens', async () => {
      userRepo.findOneBy.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);

      const result = await service.register({
        email: 'a@b.c',
        password: 'password123',
        username: 'al',
        consent: true,
        birthDate: '2000-01-01',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed' }),
      );
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('parental consent', () => {
    beforeEach(() => {
      userRepo.findOneBy.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed' as never);
    });

    it('rejects users under 13', async () => {
      await expect(
        service.register({
          email: 'kid@b.c',
          password: 'password123',
          username: 'kid',
          consent: true,
          birthDate: '2020-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('requires a parent email and consent under 15', async () => {
      await expect(
        service.register({
          email: 'teen@b.c',
          password: 'password123',
          username: 'teen',
          consent: true,
          birthDate: '2012-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts an under-15 user with parental consent', async () => {
      const result = await service.register({
        email: 'teen@b.c',
        password: 'password123',
        username: 'teen',
        consent: true,
        birthDate: '2012-01-01',
        parentEmail: 'parent@b.c',
        parentalConsent: true,
      });

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ parentEmail: 'parent@b.c' }),
      );
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@y.z', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u',
        email: 'a@b.c',
        password: 'hashed',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login({ email: 'a@b.c', password: 'nope' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns tokens on valid credentials', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'u',
        email: 'a@b.c',
        password: 'hashed',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login({
        email: 'a@b.c',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('refresh', () => {
    it('rejects a token that fails verification', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the stored hash does not match', async () => {
      jwtService.verify.mockReturnValue({ sub: 'u' });
      userRepo.findOne.mockResolvedValue({
        id: 'u',
        email: 'a@b.c',
        refreshTokenHash: 'stored',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.refresh('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates the tokens on a valid refresh', async () => {
      jwtService.verify.mockReturnValue({ sub: 'u' });
      userRepo.findOne.mockResolvedValue({
        id: 'u',
        email: 'a@b.c',
        refreshTokenHash: 'stored',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('new-hash' as never);

      const result = await service.refresh('token');

      expect(userRepo.update).toHaveBeenCalledWith('u', {
        refreshTokenHash: 'new-hash',
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token hash', async () => {
      await service.logout('u');

      expect(userRepo.update).toHaveBeenCalledWith('u', {
        refreshTokenHash: null,
      });
    });
  });
});
