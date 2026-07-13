import { TestBed } from '@angular/core/testing';
import { ProfileService } from './profile.service';
import { Api } from '../../api/api';
import { ProfileDto } from '../../api/models/profile-dto';

function profile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    id: 'u1',
    email: 'a@b.c',
    username: 'alice',
    plan: 'free',
    createdAt: '2026-07-01',
    monthlyAllowance: 2,
    generationsRemaining: 2,
    ...overrides,
  };
}

describe('ProfileService', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let service: ProfileService;

  beforeEach(() => {
    invoke = vi.fn();
    TestBed.configureTestingModule({
      providers: [ProfileService, { provide: Api, useValue: { invoke } }],
    });
    service = TestBed.inject(ProfileService);
  });

  it('loads the profile into read-only signals', async () => {
    invoke.mockResolvedValue(profile({ username: 'bob', generationsRemaining: 1 }));

    await service.load();

    expect(service.username()).toBe('bob');
    expect(service.generationsRemaining()).toBe(1);
    expect(service.isPremium()).toBe(false);
  });

  it('flips to premium after subscribe', async () => {
    invoke.mockResolvedValue(profile({ plan: 'premium' }));

    await service.subscribe();

    expect(service.isPremium()).toBe(true);
    expect(service.plan()).toBe('premium');
  });

  it('clears the profile', async () => {
    invoke.mockResolvedValue(profile());
    await service.load();

    service.clear();

    expect(service.profile()).toBeNull();
    expect(service.username()).toBe('');
  });
});
