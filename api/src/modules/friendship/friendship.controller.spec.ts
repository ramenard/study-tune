import { FriendshipController } from './friendship.controller';

describe('FriendshipController', () => {
  const service = {
    sendRequest: jest.fn(),
    respondToRequest: jest.fn(),
    searchUsers: jest.fn(),
    findFriends: jest.fn(),
    findPendingReceived: jest.fn(),
    findPendingSent: jest.fn(),
    removeFriend: jest.fn(),
  };
  const req = { user: { id: 'u1' } } as never;
  let controller: FriendshipController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FriendshipController(service as never);
  });

  it('delegates all friendship operations to the service', async () => {
    await controller.sendRequest({ addresseeId: 'u2' }, req);
    await controller.respondToRequest('f1', { accept: true } as never, req);
    await controller.search('bob', req);
    await controller.findFriends(req);
    await controller.findPendingReceived(req);
    await controller.findPendingSent(req);
    await controller.removeFriend('f1', req);

    expect(service.sendRequest).toHaveBeenCalledWith(
      { addresseeId: 'u2' },
      'u1',
    );
    expect(service.respondToRequest).toHaveBeenCalledWith(
      'f1',
      { accept: true },
      'u1',
    );
    expect(service.searchUsers).toHaveBeenCalledWith('bob', 'u1');
    expect(service.findFriends).toHaveBeenCalledWith('u1');
    expect(service.findPendingReceived).toHaveBeenCalledWith('u1');
    expect(service.findPendingSent).toHaveBeenCalledWith('u1');
    expect(service.removeFriend).toHaveBeenCalledWith('f1', 'u1');
  });
});
