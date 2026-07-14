import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService, PlayableTrack } from '../../core/services/player.service';
import { PlaylistService } from '../../core/services/playlist.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { MusicService } from '../../core/services/music.service';

describe('PlayerBarComponent', () => {
  const currentTrack = signal<PlayableTrack | null>(null);
  const playing = signal(false);
  const currentTime = signal(0);
  const duration = signal(0);
  const volume = signal(1);
  const repeat = signal(false);
  const queueName = signal<string | null>(null);
  const toggle = vi.fn();

  const playerStub = {
    currentTrack,
    playing,
    currentTime,
    duration,
    volume,
    repeat,
    queueName,
    toggle,
    next: vi.fn(),
    previous: vi.fn(),
    toggleRepeat: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
  };

  const playlistStub = {
    playlists: signal([]),
    load: vi.fn(),
    addMusic: vi.fn(),
  };

  beforeEach(async () => {
    currentTrack.set(null);
    playing.set(false);
    queueName.set(null);
    toggle.mockReset();

    await TestBed.configureTestingModule({
      imports: [PlayerBarComponent],
      providers: [
        { provide: PlayerService, useValue: playerStub },
        { provide: PlaylistService, useValue: playlistStub },
        { provide: FavoritesService, useValue: { isFavorite: () => false, toggle: vi.fn() } },
        { provide: MusicService, useValue: { download: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('shows a placeholder when nothing is playing', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Aucune lecture');
    expect(text).toContain('play_arrow');
  });

  it('shows the current track, a pause icon and the playlist name while playing a queue', () => {
    currentTrack.set({ id: '1', title: 'Thermo Lo-Fi', subject: 'Physique', color: '#000' });
    playing.set(true);
    queueName.set('Révisions Physique');

    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Thermo Lo-Fi');
    expect(text).toContain('pause');
    expect(text).toContain('Révisions Physique');
  });

  it('delegates play/pause to the player service', () => {
    currentTrack.set({ id: '1', title: 'X', subject: 'Y', color: '#000' });
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('.play-btn') as HTMLButtonElement;
    button.click();

    expect(toggle).toHaveBeenCalled();
  });
});
