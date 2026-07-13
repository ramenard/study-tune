import { TestBed } from '@angular/core/testing';
import { FriendshipService } from './friendship.service';
import { Api } from '../../api/api';

describe('FriendshipService (front)', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let service: FriendshipService;

  beforeEach(() => {
    invoke = vi.fn().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [FriendshipService, { provide: Api, useValue: { invoke } }],
    });
    service = TestBed.inject(FriendshipService);
  });

  it('exposes the pending received count', async () => {
    invoke.mockResolvedValueOnce([{ id: 'f1' }, { id: 'f2' }]);

    await service.loadReceived();

    expect(service.pendingReceivedCount()).toBe(2);
  });

  it('does not query the backend for a blank search', async () => {
    await service.search('   ');

    expect(invoke).not.toHaveBeenCalled();
    expect(service.searchResults()).toEqual([]);
  });

  it('stores search results', async () => {
    invoke.mockResolvedValueOnce([{ id: 'x', username: 'bob', relationship: 'none' }]);

    await service.search('bob');

    expect(service.searchResults().length).toBe(1);
    expect(service.searchResults()[0].username).toBe('bob');
  });
});
