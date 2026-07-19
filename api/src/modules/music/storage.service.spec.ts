import { of } from 'rxjs';
import { StorageService } from './storage.service';

const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  presignedGetObject: jest.fn(),
  getObject: jest.fn(),
  removeObject: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn(() => mockMinioClient),
}));

describe('StorageService', () => {
  let http: { get: jest.Mock };
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MINIO_BUCKET = 'music';
    http = { get: jest.fn() };
    service = new StorageService(http as never);
  });

  describe('ensureBucket', () => {
    it('creates the bucket when it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);

      await service.ensureBucket();

      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
        'music',
        'us-east-1',
      );
    });

    it('does not recreate an existing bucket', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);

      await service.ensureBucket();

      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  it('stores a downloaded audio under a deterministic object name', async () => {
    http.get.mockReturnValue(
      of({ data: 'stream', headers: { 'content-length': '123' } }),
    );
    mockMinioClient.putObject.mockResolvedValue(undefined);

    const objectName = await service.downloadAndStore(
      'http://a/1.mp3',
      'user1',
      'music1',
    );

    expect(objectName).toBe('tracks/user1_music1.mp3');
    expect(mockMinioClient.putObject).toHaveBeenCalled();
  });

  it('returns a presigned url', async () => {
    mockMinioClient.presignedGetObject.mockResolvedValue('http://signed');

    await expect(service.getPresignedUrl('tracks/x.mp3')).resolves.toBe(
      'http://signed',
    );
  });

  it('removes an object', async () => {
    mockMinioClient.removeObject.mockResolvedValue(undefined);

    await service.removeObject('tracks/x.mp3');

    expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
      'music',
      'tracks/x.mp3',
    );
  });
});
