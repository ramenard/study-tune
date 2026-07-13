import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PlayerBarComponent } from './player-bar.component';
import { PlayerService, PlayableTrack } from '../../core/services/player.service';

describe('PlayerBarComponent', () => {
  const currentTrack = signal<PlayableTrack | null>(null);
  const playing = signal(false);
  const toggle = vi.fn();

  beforeEach(async () => {
    currentTrack.set(null);
    playing.set(false);
    toggle.mockReset();

    await TestBed.configureTestingModule({
      imports: [PlayerBarComponent],
      providers: [{ provide: PlayerService, useValue: { currentTrack, playing, toggle } }],
    }).compileComponents();
  });

  it('shows a placeholder when nothing is playing', () => {
    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Aucune lecture');
    expect(text).toContain('play_arrow');
  });

  it('shows the current track title and a pause icon while playing', () => {
    currentTrack.set({ id: '1', title: 'Thermo Lo-Fi', subject: 'Physique', color: '#000' });
    playing.set(true);

    const fixture = TestBed.createComponent(PlayerBarComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Thermo Lo-Fi');
    expect(text).toContain('pause');
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
