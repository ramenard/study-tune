import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LibraryComponent } from './library.component';
import { MusicService } from '@core/services/music.service';
import { PlaylistService } from '@core/services/playlist.service';
import { PlayerService } from '@core/services/player.service';
import { GenerationStatusService } from '@core/services/generation-status.service';
import { Music } from '@api/models/music';

function makeTrack(id: string, overrides: Partial<Music> = {}): Music {
  return {
    id,
    title: `Track ${id}`,
    style: 'Maths',
    status: 'complete',
    createdAt: `2026-01-${id.padStart(2, '0')}`,
    duration: 90,
    ...overrides,
  } as Music;
}

describe('LibraryComponent', () => {
  let musics: ReturnType<typeof signal<Music[]>>;
  let player: {
    currentTrack: ReturnType<typeof signal<{ id: string } | null>>;
    playing: ReturnType<typeof signal<boolean>>;
    play: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
  };
  let component: LibraryComponent;

  beforeEach(() => {
    musics = signal<Music[]>(
      Array.from({ length: 10 }, (_unused, index) => makeTrack(String(index + 1))),
    );
    player = {
      currentTrack: signal<{ id: string } | null>(null),
      playing: signal(false),
      play: vi.fn(),
      toggle: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LibraryComponent,
        {
          provide: MusicService,
          useValue: { musics, loading: signal(false), load: vi.fn(), rename: vi.fn(), remove: vi.fn() },
        },
        { provide: PlaylistService, useValue: { playlists: signal([]), load: vi.fn() } },
        { provide: PlayerService, useValue: player },
        { provide: GenerationStatusService, useValue: { checkNow: vi.fn() } },
      ],
    });

    component = TestBed.inject(LibraryComponent);
  });

  it('paginates the tracks by page size', () => {
    expect(component.totalPages()).toBe(2);
    expect(component.paged().length).toBe(8);
  });

  it('filters by the search query and resets to the first page', () => {
    component.setPage(2);
    component.onSearch('track 1');

    expect(component.page()).toBe(1);
    expect(component.filtered().every((t) => t.title?.toLowerCase().includes('track 1'))).toBe(true);
  });

  it('formats durations and maps statuses', () => {
    expect(component.formatDuration(90)).toBe('1:30');
    expect(component.formatDuration(undefined)).toBe('—');
    expect(component.statusLabel('complete')).toBe('Prête');
    expect(component.statusLabel('error')).toBe('Échec');
  });

  it('plays a playable track through the player service', () => {
    component.play(makeTrack('1'));
    expect(player.play).toHaveBeenCalled();
  });

  it('toggles the delete confirmation target', () => {
    component.toggleDelete('1');
    expect(component.deleteId()).toBe('1');
    component.toggleDelete('1');
    expect(component.deleteId()).toBeNull();
  });
});
