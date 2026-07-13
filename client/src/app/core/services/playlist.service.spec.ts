import { TestBed } from '@angular/core/testing';
import { PlaylistService } from './playlist.service';
import { Api } from '../../api/api';

describe('PlaylistService (front)', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let service: PlaylistService;

  beforeEach(() => {
    invoke = vi.fn();
    TestBed.configureTestingModule({
      providers: [PlaylistService, { provide: Api, useValue: { invoke } }],
    });
    service = TestBed.inject(PlaylistService);
  });

  it('loads playlists into the signal', async () => {
    invoke.mockResolvedValue({ data: [{ id: 'p1', name: 'Physique', musics: [] }], total: 1 });

    await service.load();

    expect(service.playlists().length).toBe(1);
    expect(service.playlists()[0].name).toBe('Physique');
  });

  it('reloads after creating a playlist', async () => {
    invoke
      .mockResolvedValueOnce({ id: 'new', name: 'Maths', musics: [] })
      .mockResolvedValueOnce({ data: [{ id: 'new', name: 'Maths', musics: [] }], total: 1 });

    await service.create('Maths');

    expect(invoke).toHaveBeenCalledTimes(2);
    expect(service.playlists()[0].name).toBe('Maths');
  });
});
