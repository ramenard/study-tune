import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  };
  const accountService = { deleteAccount: jest.fn() };
  const request = { user: { id: 'u1' } } as never;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AccountService, useValue: accountService },
      ],
    }).compile();

    controller = moduleRef.get(AuthController);
  });

  it('delegates register to the service', async () => {
    authService.register.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });
    const dto = {
      email: 'a@b.c',
      password: 'password123',
      username: 'al',
      consent: true,
      birthDate: '2000-01-01',
    };

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to the service', async () => {
    await controller.login({ email: 'a@b.c', password: 'password123' });

    expect(authService.login).toHaveBeenCalled();
  });

  it('delegates refresh to the service', async () => {
    await controller.refresh({ refreshToken: 'r' });

    expect(authService.refresh).toHaveBeenCalledWith('r');
  });

  it('delegates logout with the current user id', async () => {
    await controller.logout(request);

    expect(authService.logout).toHaveBeenCalledWith('u1');
  });

  it('delegates profile lookup with the current user id', async () => {
    await controller.me(request);

    expect(authService.getProfile).toHaveBeenCalledWith('u1');
  });

  it('delegates account deletion with the current user id', async () => {
    await controller.deleteAccount(request);

    expect(accountService.deleteAccount).toHaveBeenCalledWith('u1');
  });
});
