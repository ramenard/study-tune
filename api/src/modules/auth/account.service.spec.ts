import { AccountService } from './account.service';

describe('AccountService', () => {
  let musicRepo: { find: jest.Mock };
  let storage: { removeObject: jest.Mock };
  let managerQuery: jest.Mock;
  let dataSource: { transaction: jest.Mock };
  let service: AccountService;

  beforeEach(() => {
    musicRepo = { find: jest.fn().mockResolvedValue([]) };
    storage = { removeObject: jest.fn().mockResolvedValue(undefined) };
    managerQuery = jest.fn().mockResolvedValue([]);
    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb: (m: { query: jest.Mock }) => unknown) =>
          cb({ query: managerQuery }),
        ),
    };
    service = new AccountService(
      musicRepo as never,
      storage as never,
      dataSource as never,
    );
  });

  it('deletes the user in a transaction and removes stored objects', async () => {
    musicRepo.find.mockResolvedValue([
      { id: 'm1', objectName: 'tracks/u_m1.mp3' },
      { id: 'm2', objectName: null },
    ]);

    await service.deleteAccount('u1');

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(managerQuery).toHaveBeenCalledWith(
      'DELETE FROM "user" WHERE id = $1',
      ['u1'],
    );
    expect(managerQuery).toHaveBeenCalledWith(
      'DELETE FROM friendship WHERE "requesterId" = $1 OR "addresseeId" = $1',
      ['u1'],
    );
    expect(storage.removeObject).toHaveBeenCalledTimes(1);
    expect(storage.removeObject).toHaveBeenCalledWith('tracks/u_m1.mp3');
  });

  it('still resolves when object removal fails', async () => {
    musicRepo.find.mockResolvedValue([{ id: 'm1', objectName: 'obj' }]);
    storage.removeObject.mockRejectedValue(new Error('minio down'));

    await expect(service.deleteAccount('u1')).resolves.toBeUndefined();
  });
});
