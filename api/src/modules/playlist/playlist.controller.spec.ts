import { PlaylistController } from './playlist.controller';

describe('PlaylistController', () => {
  const service = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    getOrCreateFavorites: jest.fn(),
    toggleFavorite: jest.fn(),
    findOneByUser: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addMusic: jest.fn(),
    removeMusic: jest.fn(),
    shareWithMembers: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };
  const req = { user: { id: 'u1' } } as never;
  let controller: PlaylistController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PlaylistController(service as never);
  });

  it('delegates create and pagination', async () => {
    await controller.create({ name: 'P' }, req);
    await controller.findAll(req, 1, 10);
    expect(service.create).toHaveBeenCalledWith({ name: 'P' }, 'u1');
    expect(service.findAllByUser).toHaveBeenCalledWith('u1', 1, 10);
  });

  it('delegates favorites and toggle', async () => {
    await controller.favorites(req);
    await controller.toggleFavorite('m1', req);
    expect(service.getOrCreateFavorites).toHaveBeenCalledWith('u1');
    expect(service.toggleFavorite).toHaveBeenCalledWith('u1', 'm1');
  });

  it('delegates music and member operations', async () => {
    await controller.addMusic('p1', 'm1', req);
    await controller.removeMusic('p1', 'm1', req);
    await controller.share('p1', { memberIds: ['u2'] }, req);
    await controller.addMember('p1', 'u2', req);
    await controller.removeMember('p1', 'u2', req);

    expect(service.addMusic).toHaveBeenCalledWith('p1', 'm1', 'u1');
    expect(service.removeMusic).toHaveBeenCalledWith('p1', 'm1', 'u1');
    expect(service.shareWithMembers).toHaveBeenCalledWith('p1', ['u2'], 'u1');
    expect(service.addMember).toHaveBeenCalledWith('p1', 'u2', 'u1');
    expect(service.removeMember).toHaveBeenCalledWith('p1', 'u2', 'u1');
  });
});
