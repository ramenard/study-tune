import { Readable } from 'stream';
import { MusicController } from './music.controller';

describe('MusicController', () => {
  const service = {
    generateAndStore: jest.fn(),
    findAllByUser: jest.fn(),
    syncFromKie: jest.fn(),
    findOneByUser: jest.fn(),
    update: jest.fn(),
    getStreamUrl: jest.fn(),
    getDownload: jest.fn(),
    delete: jest.fn(),
    handleKieWebhook: jest.fn(),
  };
  const req = { user: { id: 'u1' } } as never;
  let controller: MusicController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MusicController(service as never);
  });

  it('delegates generate', async () => {
    await controller.generate({ lyrics: 'x' }, req);
    expect(service.generateAndStore).toHaveBeenCalledWith(
      { lyrics: 'x' },
      'u1',
    );
  });

  it('delegates findAll with numeric pagination', async () => {
    await controller.findAll(req, 2, 5);
    expect(service.findAllByUser).toHaveBeenCalledWith('u1', 2, 5);
  });

  it('delegates sync, findOne, update, stream and delete', async () => {
    await controller.sync('m1', req);
    await controller.findOne('m1', req);
    await controller.update('m1', { title: 'T' }, req);
    await controller.getStreamUrl('m1', req);
    await controller.delete('m1', req);

    expect(service.syncFromKie).toHaveBeenCalledWith('m1', 'u1');
    expect(service.findOneByUser).toHaveBeenCalledWith('m1', 'u1');
    expect(service.update).toHaveBeenCalledWith('m1', { title: 'T' }, 'u1');
    expect(service.getStreamUrl).toHaveBeenCalledWith('m1', 'u1');
    expect(service.delete).toHaveBeenCalledWith('m1', 'u1');
  });

  it('wraps the download into a StreamableFile', async () => {
    service.getDownload.mockResolvedValue({
      stream: Readable.from('x'),
      filename: 'a.mp3',
    });
    const result = await controller.download('m1', req);
    expect(result).toBeDefined();
  });
});
