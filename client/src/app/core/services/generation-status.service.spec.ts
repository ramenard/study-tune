import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GenerationStatusService } from './generation-status.service';
import { MusicService } from './music.service';
import { Api } from '../../api/api';
import { Music } from '../../api/models/music';

describe('GenerationStatusService', () => {
  let invoke: ReturnType<typeof vi.fn>;
  let open: ReturnType<typeof vi.fn>;
  let musics: ReturnType<typeof signal<Music[]>>;
  let service: GenerationStatusService;

  beforeEach(() => {
    invoke = vi.fn();
    open = vi.fn().mockReturnValue({ onAction: () => ({ subscribe: vi.fn() }) });
    musics = signal<Music[]>([]);

    TestBed.configureTestingModule({
      providers: [
        GenerationStatusService,
        { provide: Api, useValue: { invoke } },
        { provide: MusicService, useValue: { load: vi.fn().mockResolvedValue(undefined), musics } },
        { provide: MatSnackBar, useValue: { open } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(GenerationStatusService);
  });

  afterEach(() => service.clear());

  it('tracks a new generation as pending', () => {
    service.watch('m1', 'Ma musique');
    expect(service.pendingCount()).toBe(1);
    expect(service.isGenerating()).toBe(true);
  });

  it('notifies and clears the pending item when the track is ready', async () => {
    musics.set([{ id: 'm1', status: 'generating', title: 'Thermo' } as Music]);
    invoke.mockResolvedValue({ id: 'm1', status: 'complete', title: 'Thermo' });

    await service.checkNow();

    expect(service.pendingCount()).toBe(0);
    expect(open).toHaveBeenCalled();
    expect(open.mock.calls[0][0]).toContain('Thermo');
  });

  it('keeps the item pending while still generating', async () => {
    service.watch('m2', 'En cours');
    invoke.mockResolvedValue({ id: 'm2', status: 'generating' });

    await service.checkNow();

    expect(service.pendingCount()).toBe(1);
    expect(open).not.toHaveBeenCalled();
  });
});
