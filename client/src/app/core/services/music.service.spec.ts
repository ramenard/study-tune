import { TestBed } from '@angular/core/testing';
import { MusicService } from './music.service';
import { Api } from '../../api/api';

describe('MusicService (front)', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let service: MusicService;

  beforeEach(() => {
    invoke = vi.fn();
    TestBed.configureTestingModule({
      providers: [MusicService, { provide: Api, useValue: { invoke } }],
    });
    service = TestBed.inject(MusicService);
  });

  it('loads the user tracks into the signal', async () => {
    invoke.mockResolvedValue({
      data: [{ id: 'm1', title: 'Thermo', status: 'complete' }],
      total: 1,
    });

    await service.load();

    expect(service.musics().length).toBe(1);
    expect(service.musics()[0].title).toBe('Thermo');
  });

  it('returns the presigned stream url', async () => {
    invoke.mockResolvedValue({ url: 'https://minio/track.mp3' });

    const url = await service.getStreamUrl('m1');

    expect(url).toBe('https://minio/track.mp3');
  });
});
